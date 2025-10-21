const crypto = require('crypto');

// Generate a random student ID
const generateStudentId = () => {
  // Format: STU-XXXXXX (6 random alphanumeric characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'STU-';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Alternative: Using crypto for more secure random generation
const generateSecureStudentId = () => {
  const randomBytes = crypto.randomBytes(4); // 4 bytes = 8 hex characters
  return 'STU-' + randomBytes.toString('hex').toUpperCase().substring(0, 6);
};

// Verify ID format (for future validation)
const isValidStudentId = (studentId) => {
  const pattern = /^STU-[A-Z0-9]{6}$/;
  return pattern.test(studentId);
};

module.exports = { 
  generateStudentId, 
  generateSecureStudentId, 
  isValidStudentId 
};