const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = 'your-secret-key-here';

// ========== ID GENERATOR ==========
const generateSecureStudentId = () => {
  const randomBytes = crypto.randomBytes(4); // 4 bytes = 8 hex characters
  return 'STU-' + randomBytes.toString('hex').toUpperCase().substring(0, 6);
};

// ========== EMAIL CONFIGURATION ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dahmenyassine@gmail.com', // Gmail address
    pass: 'ogsa dazu ddis yrpe' // ←  App Password
  },
  debug: true, // This will show detailed email logs
  logger: true
});

const sendStudentIdEmail = async (email, studentId, username) => {
  try {
    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`🔑 Using email: dahmenyassine@gmail.com`);
    
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

    console.log('📨 Sending email with options:', { 
      from: mailOptions.from, 
      to: mailOptions.to,
      subject: mailOptions.subject 
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📤 Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Command:', error.command);
    return false;
  }
};

// Initialize database
const db = new sqlite3.Database('./students.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    
    // Update students table to use TEXT ID for custom IDs
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,  -- Changed to TEXT for custom IDs like STU-XXXXXX
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      major TEXT NOT NULL,
      grade TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Update users table to include email (without UNIQUE constraint initially)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,  -- Added email field (no UNIQUE constraint initially)
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      student_id TEXT UNIQUE,      -- Changed to TEXT
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

    // Create student_marks table (student_id now TEXT)
    db.run(`CREATE TABLE IF NOT EXISTS student_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,    -- Changed to TEXT
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

// ========== MIDDLEWARE DEFINITIONS ==========

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

// ========== DATABASE FIX ROUTES ==========

// Fix missing email column (handles existing data)
router.get('/fix-schema', (req, res) => {
  console.log('🛠️ Checking and fixing users table schema...');
  
  // First check if email column exists
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      console.error('❌ Error checking schema:', err.message);
      return res.status(500).json({ error: err.message });
    }
    
    const hasEmail = columns.some(col => col.name === 'email');
    
    if (hasEmail) {
      console.log('✅ Email column already exists');
      return res.json({ 
        message: 'Email column already exists in users table',
        status: 'already_exists'
      });
    }
    
    // Add the email column WITHOUT UNIQUE constraint first
    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, function(err) {
      if (err) {
        console.error('❌ Error adding email column:', err.message);
        return res.status(500).json({ 
          error: 'Failed to add email column',
          details: err.message 
        });
      }
      
      console.log('✅ Email column added successfully!');
      
      // Update existing records to have placeholder emails
      db.run(`UPDATE users SET email = 'user' || id || '@placeholder.com' WHERE email IS NULL`, function(updateErr) {
        if (updateErr) {
          console.warn('🟡 Could not set placeholder emails:', updateErr.message);
        } else {
          console.log('✅ Set placeholder emails for existing users');
        }
        
        res.json({ 
          message: 'Email column added to users table successfully! You can now use email registration.',
          status: 'added',
          changes: this.changes
        });
      });
    });
  });
});

// Check current schema
router.get('/debug/users-schema', (req, res) => {
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log('📋 CURRENT USERS TABLE COLUMNS:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    res.json(columns);
  });
});

// ========== AUTHENTICATION ROUTES ==========

// POST /auth/register - Student registration with email verification
router.post('/auth/register', async (req, res) => {
  console.log('🔵 REGISTRATION STARTED');
  
  try {
    const { username, password, email } = req.body;
    console.log('🔵 Request body:', { username, email });

    // Validation
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('🔵 Starting database checks...');

    // Check if username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        console.error('🔴 DATABASE ERROR (username check):', err.message);
        return res.status(500).json({ 
          error: 'Database error during username check',
          details: err.message 
        });
      }
      
      if (existingUser) {
        console.log('🔴 Username already exists:', username);
        return res.status(400).json({ error: 'Username already exists' });
      }

      console.log('🟢 Username available');

      // Check if email already exists (manual check)
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingEmail) => {
        if (err) {
          // If error is about missing email column, guide user to fix schema
          if (err.message.includes('no such column: email')) {
            console.error('🔴 EMAIL COLUMN MISSING - Run /fix-schema first');
            return res.status(500).json({ 
              error: 'Database configuration required',
              details: 'Please visit /students/fix-schema to set up the database first',
              fixUrl: '/students/fix-schema'
            });
          }
          
          console.error('🔴 DATABASE ERROR (email check):', err.message);
          return res.status(500).json({ 
            error: 'Database error during email check',
            details: err.message 
          });
        }
        
        if (existingEmail) {
          console.log('🔴 Email already registered:', email);
          return res.status(400).json({ error: 'Email already registered' });
        }

        console.log('🟢 Email available');

        // Generate NUMERIC student ID to match database schema
        const studentId = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
        console.log('🎯 Generated Student ID:', studentId);

        // Create student record
        db.run(
          'INSERT INTO students (id, name, age, major, grade) VALUES (?, ?, ?, ?, ?)',
          [studentId, username, 18, 'General', 'A'],
          function(err) {
            if (err) {
              console.error('🔴 STUDENT INSERT ERROR:', err.message);
              return res.status(500).json({ 
                error: 'Error creating student record',
                details: err.message 
              });
            }

            console.log('✅ Student record created with ID:', studentId);

            // Create user account WITH email
            db.run(
              'INSERT INTO users (username, password, email, role, student_id) VALUES (?, ?, ?, ?, ?)',
              [username, password, email, 'student', studentId],
              async function(err) {
                if (err) {
                  console.error('🔴 USER INSERT ERROR:', err.message);
                  
                  // Rollback student record if user creation fails
                  db.run('DELETE FROM students WHERE id = ?', [studentId]);
                  
                  return res.status(500).json({ 
                    error: 'Error creating user account',
                    details: err.message 
                  });
                }

                console.log('✅ User account created with email:', email);

                // Send welcome email with student ID
                try {
                  console.log('📧 Attempting to send welcome email...');
                  const emailSent = await sendStudentIdEmail(email, studentId, username);
                  
                  if (emailSent) {
                    console.log('✅ Welcome email sent successfully');
                  } else {
                    console.warn('🟡 Email sending failed, but registration completed');
                  }

                  console.log('🎉 REGISTRATION COMPLETED SUCCESSFULLY!');
                  
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

                } catch (emailError) {
                  console.warn('🟡 Email error (non-critical):', emailError.message);
                  
                  // Registration still successful even if email fails
                  res.status(201).json({
                    message: 'Account created successfully!',
                    user: {
                      id: this.lastID,
                      username,
                      email,
                      role: 'student',
                      studentId: studentId
                    },
                    studentId: studentId,
                    emailSent: false,
                    emailError: 'Welcome email could not be sent'
                  });
                }
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error('🔴 UNEXPECTED ERROR:', error);
    res.status(500).json({ 
      error: 'Unexpected server error during registration',
      details: error.message 
    });
  }
});

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
          studentId: user.student_id,
          email: user.email
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

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

// TEMPORARY: Delete user by username or email
router.delete('/debug/delete-user/:identifier', (req, res) => {
  const { identifier } = req.params;
  
  console.log(`Attempting to delete user: ${identifier}`);
  
  // First, find the user and their student_id
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Found user:', user);
    
    // Delete user account
    db.run('DELETE FROM users WHERE id = ?', [user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      console.log(`Deleted user: ${user.username}`);
      
      // If user has a student record, delete it too
      if (user.student_id) {
        db.run('DELETE FROM students WHERE id = ?', [user.student_id], function(err) {
          if (err) {
            console.warn('Could not delete student record:', err.message);
          } else {
            console.log(`Deleted student record: ${user.student_id}`);
          }
          
          res.json({ 
            message: `Successfully deleted user '${user.username}' and their student record`,
            deletedUser: user.username,
            deletedStudentId: user.student_id
          });
        });
      } else {
        res.json({ 
          message: `Successfully deleted user '${user.username}'`,
          deletedUser: user.username
        });
      }
    });
  });
});

// TEMPORARY: List all users
router.get('/debug/all-users', (req, res) => {
  db.all('SELECT id, username, email, role, student_id FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log('All users:', users);
    res.json(users);
  });
});

module.exports = router;