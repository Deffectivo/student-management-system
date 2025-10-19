const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

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
  }
});

// GET /students - Get all students with filtering and sorting
router.get('/', (req, res) => {
  const { major, grade, sortBy, sortOrder = 'ASC' } = req.query;
  
  let query = 'SELECT * FROM students WHERE 1=1';
  const params = [];

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

// GET /students/:id - Get single student
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(row);
  });
});

// POST /students - Create new student
router.post('/', (req, res) => {
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

// PUT /students/:id - Update student
router.put('/:id', (req, res) => {
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

// DELETE /students/:id - Delete student
router.delete('/:id', (req, res) => {
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

module.exports = router;