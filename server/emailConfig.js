const nodemailer = require('nodemailer');

// Email configuration (using Gmail as example)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'dahmenyassine@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASS || 'DarkLover3'     // Replace with your app password
  }
});

// Alternative: Using SMTP (for other email providers)
/*
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-email-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
*/

const sendStudentIdEmail = async (email, studentId, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Your Student Management System ID',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Student Management System</h2>
          <p>Hello ${username},</p>
          <p>Your account has been successfully created!</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin: 0;">Your Student ID: <strong>${studentId}</strong></h3>
          </div>
          <p><strong>Please save this ID securely!</strong> You'll need it to:</p>
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
    console.log(`Student ID email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { transporter, sendStudentIdEmail };