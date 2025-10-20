const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS - allow all origins (for development)
app.use(cors());

// Or more specific:
// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const studentRoutes = require('./routes/students');
app.use('/students', studentRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working perfectly!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});