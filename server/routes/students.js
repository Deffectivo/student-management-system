const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-here'; // Change this in production!

// Updated export routes to handle token in query parameter
router.get('/export/csv', (req, res) => {
  const { access_token, ...filters } = req.query;
  
  // Manual token verification for export routes
  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(access_token, JWT_SECRET);
    req.user = user;
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Rest of your CSV export code...
});

router.get('/export/pdf', (req, res) => {
  const { access_token, ...filters } = req.query;
  
  // Manual token verification for export routes
  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(access_token, JWT_SECRET);
    req.user = user;
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Rest of your PDF export code...
});

// Initialize database
const db = new sqlite3.Database('./students.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      major TEXT NOT NULL,
      grade TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      student_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('✅ Users table ready');
        
        // Add a default admin user
        db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
        ['admin', 'admin123', 'admin'], (err) => {
          if (err) {
            console.error('Error creating default admin:', err);
          } else {
            console.log('✅ Default admin user created');
          }
        });
      }
    });

    // Create student_marks table
    db.run(`CREATE TABLE IF NOT EXISTS student_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      marks_obtained INTEGER NOT NULL,
      total_marks INTEGER NOT NULL,
      test_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating marks table:', err);
      } else {
        console.log('✅ Student marks table ready');
      }
    });
  }
});

// ========== MIDDLEWARE DEFINITIONS (PUT THESE FIRST!) ==========

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const json2csv = require('json2csv').parse;
const PDFDocument = require('pdfkit');

// ========== EXPORT ROUTES ==========

// GET /export/csv - Export students to CSV
router.get('/export/csv', authenticateToken, (req, res) => {
  const { major, grade, search } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  // Apply filters
  if (req.user.role === 'student' && req.user.studentId) {
    query += ' AND id = ?';
    params.push(req.user.studentId);
  }

  if (search) {
    query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ? OR CAST(age AS TEXT) LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (major) {
    query += ' AND major = ?';
    params.push(major);
  }

  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, students) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      const fields = ['id', 'name', 'age', 'major', 'grade', 'created_at'];
      const csv = json2csv(students, { fields });

      res.header('Content-Type', 'text/csv');
      res.attachment(`students-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: 'Error generating CSV' });
    }
  });
});

// GET /export/pdf - Export students to PDF report
router.get('/export/pdf', authenticateToken, (req, res) => {
  const { major, grade, search } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  // Apply filters
  if (req.user.role === 'student' && req.user.studentId) {
    query += ' AND id = ?';
    params.push(req.user.studentId);
  }

  if (search) {
    query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ? OR CAST(age AS TEXT) LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (major) {
    query += ' AND major = ?';
    params.push(major);
  }

  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, students) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      const doc = new PDFDocument();
      const filename = `students-report-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      doc.pipe(res);

      // Add title
      doc.fontSize(20).text('Student Management System Report', 100, 100);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);
      doc.fontSize(12).text(`Total Students: ${students.length}`, 100, 150);
      
      // Add filters info
      let yPosition = 180;
      if (major || grade || search) {
        doc.fontSize(12).text('Applied Filters:', 100, yPosition);
        yPosition += 20;
        if (major) doc.text(`• Major: ${major}`, 120, yPosition);
        if (grade) doc.text(`• Grade: ${grade}`, 120, yPosition + 20);
        if (search) doc.text(`• Search: ${search}`, 120, yPosition + 40);
        yPosition += 60;
      }

      // Add table headers
      doc.fontSize(10);
      const tableTop = yPosition + 30;
      doc.text('ID', 50, tableTop);
      doc.text('Name', 80, tableTop);
      doc.text('Age', 200, tableTop);
      doc.text('Major', 240, tableTop);
      doc.text('Grade', 350, tableTop);

      // Add students data
      let y = tableTop + 20;
      students.forEach((student, index) => {
        if (y > 700) { // New page if needed
          doc.addPage();
          y = 100;
        }
        
        doc.text(student.id.toString(), 50, y);
        doc.text(student.name, 80, y);
        doc.text(student.age.toString(), 200, y);
        doc.text(student.major, 240, y);
        doc.text(student.grade, 350, y);
        
        y += 20;
      });

      // Add statistics
      doc.addPage();
      doc.fontSize(16).text('Statistics Summary', 100, 100);
      
      // Calculate statistics
      const gradeCount = students.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {});

      const majorCount = students.reduce((acc, student) => {
        acc[student.major] = (acc[student.major] || 0) + 1;
        return acc;
      }, {});

      let statsY = 150;
      doc.fontSize(12).text('Grade Distribution:', 100, statsY);
      statsY += 20;
      Object.entries(gradeCount).forEach(([grade, count]) => {
        doc.text(`• ${grade}: ${count} students (${((count / students.length) * 100).toFixed(1)}%)`, 120, statsY);
        statsY += 15;
      });

      statsY += 20;
      doc.text('Major Distribution:', 100, statsY);
      statsY += 20;
      Object.entries(majorCount).forEach(([major, count]) => {
        doc.text(`• ${major}: ${count} students`, 120, statsY);
        statsY += 15;
      });

      doc.end();
    } catch (error) {
      res.status(500).json({ error: 'Error generating PDF' });
    }
  });
});

// GET /export/statistics - Get statistics for dashboard
router.get('/export/statistics', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_students FROM students',
    'SELECT major, COUNT(*) as count FROM students GROUP BY major',
    'SELECT grade, COUNT(*) as count FROM students GROUP BY grade',
    'SELECT AVG(age) as average_age FROM students'
  ];

  db.serialize(() => {
    const results = {};
    
    db.get(queries[0], (err, row) => {
      if (!err) results.totalStudents = row.total_students;
    });
    
    db.all(queries[1], (err, rows) => {
      if (!err) results.majors = rows;
    });
    
    db.all(queries[2], (err, rows) => {
      if (!err) results.grades = rows;
    });
    
    db.get(queries[3], (err, row) => {
      if (!err) results.averageAge = Math.round(row.average_age);
      
      // Send all results
      res.json(results);
    });
  });
});

// ========== AUTHENTICATION ROUTES ==========

// POST /auth/login - User login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user in database
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password (for now using simple comparison, in production use bcrypt.compare)
      const isPasswordValid = password === user.password;
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          studentId: user.student_id 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          studentId: user.student_id
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /auth/register - Student registration
router.post('/auth/register', async (req, res) => {
  const { username, password, studentId } = req.body;

  if (!username || !password || !studentId) {
    return res.status(400).json({ error: 'Username, password, and student ID are required' });
  }

  try {
    // Check if student exists
    db.get('SELECT * FROM students WHERE id = ?', [studentId], async (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!student) {
        return res.status(400).json({ error: 'Student ID not found' });
      }

      // Check if username already exists
      db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if student already has an account
        db.get('SELECT * FROM users WHERE student_id = ?', [studentId], async (err, studentAccount) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (studentAccount) {
            return res.status(400).json({ error: 'This student already has an account' });
          }

          // Create the student account
          db.run(
            'INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)',
            [username, password, 'student', studentId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error creating account' });
              }
              
              res.status(201).json({
                message: 'Student account created successfully',
                user: {
                  id: this.lastID,
                  username,
                  role: 'student',
                  studentId
                }
              });
            }
          );
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ========== STUDENT ROUTES (WITH AUTHENTICATION) ==========

// GET /students - Get all students with filtering, sorting, and searching
router.get('/', authenticateToken, (req, res) => {
  const { major, grade, sortBy, sortOrder = 'ASC', search } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  // If user is a student, only show their own data
  if (req.user.role === 'student' && req.user.studentId) {
    query += ' AND id = ?';
    params.push(req.user.studentId);
  }

  // Search across multiple fields
  if (search) {
    query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ? OR CAST(age AS TEXT) LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Existing filters
  if (major) {
    query += ' AND major = ?';
    params.push(major);
  }

  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }

  const validSortColumns = ['name', 'age', 'major', 'grade', 'created_at'];
  if (sortBy && validSortColumns.includes(sortBy)) {
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  } else {
    query += ' ORDER BY created_at DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /students - Create new student (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, age, major, grade } = req.body;
  
  if (!name || !age || !major || !grade) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'INSERT INTO students (name, age, major, grade) VALUES (?, ?, ?, ?)',
    [name, parseInt(age), major, grade],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ 
        id: this.lastID, 
        name, age, major, grade,
        message: 'Student created successfully' 
      });
    }
  );
});

// PUT /students/:id - Update student (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, age, major, grade } = req.body;

  if (!name || !age || !major || !grade) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    'UPDATE students SET name = ?, age = ?, major = ?, grade = ? WHERE id = ?',
    [name, parseInt(age), major, grade, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
      res.json({ 
        message: 'Student updated successfully',
        student: { id: parseInt(id), name, age: parseInt(age), major, grade }
      });
    }
  );
});

// DELETE /students/:id - Delete student (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json({ message: 'Student deleted successfully' });
  });
});

// ========== MARKS ROUTES ==========

// GET /students/:id/marks - Get all marks for a student
router.get('/:id/marks', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Check if user has permission to view these marks
  if (req.user.role === 'student' && req.user.studentId != id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(`
    SELECT sm.*, s.name as student_name 
    FROM student_marks sm 
    JOIN students s ON sm.student_id = s.id 
    WHERE sm.student_id = ? 
    ORDER BY sm.test_date DESC
  `, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /students/:id/marks - Add marks for a student (Admin only)
router.post('/:id/marks', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { test_name, subject, marks_obtained, total_marks, test_date } = req.body;
  
  if (!test_name || !subject || !marks_obtained || !total_marks) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const percentage = ((marks_obtained / total_marks) * 100).toFixed(2);
  
  db.run(
    `INSERT INTO student_marks (student_id, test_name, subject, marks_obtained, total_marks, test_date) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, test_name, subject, parseInt(marks_obtained), parseInt(total_marks), test_date || new Date().toISOString().split('T')[0]],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ 
        id: this.lastID,
        test_name, subject, marks_obtained, total_marks, percentage,
        message: 'Marks added successfully' 
      });
    }
  );
});

// GET /marks/subjects - Get all unique subjects
router.get('/marks/subjects', authenticateToken, (req, res) => {
  db.all('SELECT DISTINCT subject FROM student_marks ORDER BY subject', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.subject));
  });
});

module.exports = router;