const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const studentRoutes = require('./routes/students');
app.use('/students', studentRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Management System API',
    endpoints: {
      students: '/students',
      test: '/test'
    }
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working perfectly!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 Test URL: http://localhost:${PORT}/test`);
  console.log(`📍 Students API: http://localhost:${PORT}/students`);
});