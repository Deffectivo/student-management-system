const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// More specific CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test CORS route
app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Import routes
const studentRoutes = require('./routes/students');
app.use('/students', studentRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working perfectly!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ CORS enabled for: http://localhost:3000`);
});