const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const JWT_SECRET = 'your-secret-key-here';

// ========== ID GENERATOR ==========
const generateSecureStudentId = () => {
  const randomBytes = crypto.randomBytes(4);
  return 'STU-' + randomBytes.toString('hex').toUpperCase().substring(0, 6);
};

// ========== EMAIL CONFIGURATION ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dahmenyassine@gmail.com',
    pass: 'ogsa dazu ddis yrpe'
  }
});

const sendStudentIdEmail = async (email, studentId, username) => {
  try {
    const mailOptions = {
      from: '"Student Management System" <dahmenyassine@gmail.com>',
      to: email,
      subject: 'Your Student ID - Student Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">🎓 Student Management System</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your student account has been successfully created!</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin: 0;">Your Student ID: <strong style="font-size: 1.2em;">${studentId}</strong></h3>
          </div>
          <p><strong>🔐 Please save this ID securely!</strong> You'll need it to:</p>
          <ul>
            <li>Access your student dashboard</li>
            <li>View your grades and test marks</li>
            <li>Recover your account if needed</li>
          </ul>
          <p>If you didn't create this account, please contact the administrator immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
};

// Initialize database
const db = new sqlite3.Database('./students.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      major TEXT NOT NULL,
      grade TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      student_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('✅ Users table ready');
        
        // Add default admin user
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

    db.run(`CREATE TABLE IF NOT EXISTS student_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
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

// ========== MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ========== CORS HANDLING FOR EXPORTS ==========
// Handle preflight OPTIONS requests for export routes
router.options('/export/csv', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

router.options('/export/pdf', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// ========== TEST PDF ROUTE ==========
router.get('/test-pdf', (req, res) => {
  try {
    console.log('Testing PDF generation...');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    
    doc.pipe(res);
    doc.fontSize(25).text('This is a test PDF!', 100, 100);
    doc.text('If you can see this, PDF generation works!', 100, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 100, 200);
    doc.end();
    
    console.log('✅ Test PDF generated successfully');
  } catch (error) {
    console.error('❌ Test PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTHENTICATION ROUTES ==========
router.post('/auth/register', async (req, res) => {
  console.log('🔵 REGISTRATION STARTED');
  
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check username
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error during username check' });
      }
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Check email
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingEmail) => {
        if (err) {
          if (err.message.includes('no such column: email')) {
            return res.status(500).json({ 
              error: 'Database configuration required - please run schema fix first'
            });
          }
          return res.status(500).json({ error: 'Database error during email check' });
        }
        
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate student ID
        const studentId = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🎯 Generated Student ID:', studentId);

        // Create student record
        db.run(
          'INSERT INTO students (id, name, age, major, grade) VALUES (?, ?, ?, ?, ?)',
          [studentId, username, 18, 'General', 'A'],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error creating student record' });
            }

            // Create user account
            db.run(
              'INSERT INTO users (username, password, email, role, student_id) VALUES (?, ?, ?, ?, ?)',
              [username, password, email, 'student', studentId],
              async function(err) {
                if (err) {
                  db.run('DELETE FROM students WHERE id = ?', [studentId]);
                  return res.status(500).json({ error: 'Error creating user account' });
                }

                // Send welcome email
                const emailSent = await sendStudentIdEmail(email, studentId, username);
                
                res.status(201).json({
                  message: emailSent 
                    ? 'Account created successfully! Check your email for your Student ID.' 
                    : 'Account created successfully!',
                  user: {
                    id: this.lastID,
                    username,
                    email,
                    role: 'student',
                    studentId: studentId
                  },
                  studentId: studentId,
                  emailSent: emailSent
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error('🔴 UNEXPECTED ERROR:', error);
    res.status(500).json({ error: 'Unexpected server error during registration' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = password === user.password;
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
        studentId: user.student_id,
        email: user.email
      }
    });
  });
});

// ========== EXPORT ROUTES ==========
router.get('/export/csv', authenticateToken, (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { major, grade, search } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (req.user.role === 'student' && req.user.studentId) {
    query += ' AND id = ?';
    params.push(req.user.studentId);
  }

  if (search) {
    query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
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
      const fields = [
        { label: 'Student ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Age', value: 'age' },
        { label: 'Major', value: 'major' },
        { label: 'Grade', value: 'grade' },
        { label: 'Created Date', value: 'created_at' }
      ];
      
      const parser = new Parser({ fields });
      const csv = parser.parse(students);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="students-${Date.now()}.csv"`);
      res.send(csv);
      
    } catch (error) {
      console.error('CSV generation error:', error);
      res.status(500).json({ error: 'Error generating CSV' });
    }
  });
});

router.get('/export/pdf', authenticateToken, (req, res) => {
  try {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { major, grade, search } = req.query;
    
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (req.user.role === 'student' && req.user.studentId) {
      query += ' AND id = ?';
      params.push(req.user.studentId);
    }

    if (search) {
      query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
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
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log(`📊 Generating PDF for ${students.length} students`);

      try {
        const doc = new PDFDocument();
        const filename = `students-report-${Date.now()}.pdf`;

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Handle PDF errors
        doc.on('error', (error) => {
          console.error('PDF stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'PDF generation failed' });
          }
        });

        // Pipe to response
        doc.pipe(res);

        // Simple PDF content
        doc.fontSize(20).text('STUDENT MANAGEMENT SYSTEM', 50, 50);
        doc.fontSize(12).text(`Report Generated: ${new Date().toLocaleString()}`, 50, 80);
        doc.text(`Total Students: ${students.length}`, 50, 100);
        
        // Add a line
        doc.moveTo(50, 120).lineTo(550, 120).stroke();
        
        let y = 150;
        
        // Simple table headers
        doc.fontSize(10);
        doc.text('ID', 50, y);
        doc.text('NAME', 100, y);
        doc.text('AGE', 250, y);
        doc.text('MAJOR', 300, y);
        doc.text('GRADE', 450, y);
        
        y += 30;
        
        // Student data
        students.forEach((student, index) => {
          // Simple page break
          if (y > 700) {
            doc.addPage();
            y = 50;
            // Add headers on new page
            doc.text('ID', 50, y);
            doc.text('NAME', 100, y);
            doc.text('AGE', 250, y);
            doc.text('MAJOR', 300, y);
            doc.text('GRADE', 450, y);
            y += 30;
          }
          
          doc.text(student.id.toString(), 50, y);
          doc.text(student.name, 100, y);
          doc.text(student.age.toString(), 250, y);
          doc.text(student.major, 300, y);
          doc.text(student.grade, 450, y);
          
          y += 20;
        });

        // Finalize PDF
        doc.end();
        console.log('✅ PDF generated successfully');
        
      } catch (pdfError) {
        console.error('PDF creation error:', pdfError);
        res.status(500).json({ error: 'Failed to create PDF document' });
      }
    });

  } catch (error) {
    console.error('PDF route error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

router.get('/export/statistics', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_students FROM students',
    'SELECT major, COUNT(*) as count FROM students GROUP BY major',
    'SELECT grade, COUNT(*) as count FROM students GROUP BY grade',
    'SELECT AVG(age) as average_age FROM students'
  ];

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
    if (!err) results.averageAge = Math.round(row.average_age || 0);
    res.json(results);
  });
});

// ========== STUDENT ROUTES ==========
router.get('/', authenticateToken, (req, res) => {
  const { major, grade, sortBy, sortOrder = 'ASC', search } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (req.user.role === 'student' && req.user.studentId) {
    query += ' AND id = ?';
    params.push(req.user.studentId);
  }

  if (search) {
    query += ' AND (name LIKE ? OR major LIKE ? OR grade LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

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
        message: 'Student created successfully',
        student: { name, age, major, grade }
      });
    }
  );
});

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
        student: { id, name, age: parseInt(age), major, grade }
      });
    }
  );
});

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
router.get('/:id/marks', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role === 'student' && req.user.studentId !== id) {
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
        message: 'Marks added successfully',
        marks: { test_name, subject, marks_obtained, total_marks, percentage }
      });
    }
  );
});

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