import React, { useState } from 'react';
import studentService from '../services/studentService';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    studentId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await studentService.login(loginData.username, loginData.password);
      onLogin();
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (registerData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      await studentService.register(
        registerData.username, 
        registerData.password, 
        registerData.studentId
      );
      alert('Registration successful! You can now login.');
      setIsRegistering(false);
      setRegisterData({
        username: '',
        password: '',
        confirmPassword: '',
        studentId: ''
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Student Management System</h2>
        
        {!isRegistering ? (
          // LOGIN FORM
          <>
            <h3>Login</h3>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  required
                  placeholder="Enter username"
                />
              </div>
              
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                  placeholder="Enter password"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <div className="auth-switch">
              <p>Don't have an account? 
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => setIsRegistering(true)}
                >
                  Register here
                </button>
              </p>
            </div>
          </>
        ) : (
          // REGISTRATION FORM
          <>
            <h3>Student Registration</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Student ID:</label>
                <input
                  type="number"
                  name="studentId"
                  value={registerData.studentId}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Enter your student ID"
                  min="1"
                />
                <small className="help-text">
                  Your student ID is provided by your institution
                </small>
              </div>
              
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Choose a username"
                />
              </div>
              
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Choose a password (min. 6 characters)"
                  minLength="6"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            
            <div className="auth-switch">
              <p>Already have an account? 
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => setIsRegistering(false)}
                >
                  Login here
                </button>
              </p>
            </div>
          </>
        )}
        
        <div className="demo-accounts">
          <h4>Demo Accounts:</h4>
          <p><strong>Admin:</strong> username: <code>admin</code>, password: <code>admin123</code></p>
          <p><em>Student accounts can be created using your student ID</em></p>
        </div>
      </div>
    </div>
  );
};

export default Login;