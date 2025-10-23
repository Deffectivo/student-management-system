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
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  // Real-time password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/(?=.*[a-z])/.test(password)) strength += 1;
    if (/(?=.*[A-Z])/.test(password)) strength += 1;
    if (/(?=.*\d)/.test(password)) strength += 1;
    if (/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) strength += 1;
    
    const strengthLabels = {
      0: { label: 'Very Weak', color: '#ff4d4f' },
      1: { label: 'Weak', color: '#ff7875' },
      2: { label: 'Fair', color: '#ffa940' },
      3: { label: 'Good', color: '#ffc53d' },
      4: { label: 'Strong', color: '#73d13d' },
      5: { label: 'Very Strong', color: '#389e0d' }
    };
    
    return { strength, ...strengthLabels[strength] };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    try {
      await studentService.login(loginData.username, loginData.password);
      onLogin();
    } catch (error) {
      setLoginError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);
    setSuccessMessage('');

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const errors = validatePassword(registerData.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setRegisterError('Please fix the password requirements below');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setRegisterError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const result = await studentService.register(
        registerData.username, 
        registerData.password,
        registerData.email
      );
      
      // Set success message without alert
      let message = result.message;
      if (result.studentId && !result.emailSent) {
        message += `\n\nYour Student ID: ${result.studentId}\n\nSave this ID securely!`;
      }
      
      setSuccessMessage(message);
      setRegisterSuccess(true);
      
      // Reset form after successful registration
      setTimeout(() => {
        setIsRegistering(false);
        setRegisterData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setPasswordErrors([]);
        setRegisterSuccess(false);
        setSuccessMessage('');
      }, 5000); // Auto-switch back to login after 5 seconds
      
    } catch (error) {
      setRegisterError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setLoginError(''); // Clear error when user starts typing
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value
    });

    // Clear errors when user starts typing
    setRegisterError('');

    // Real-time password validation
    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const resetForms = () => {
    setLoginError('');
    setRegisterError('');
    setRegisterSuccess(false);
    setSuccessMessage('');
    setPasswordErrors([]);
  };

  const passwordStrength = getPasswordStrength(registerData.password);

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Student Management System</h2>
        
        {!isRegistering ? (
          // LOGIN FORM
          <>
            <h3>Login</h3>
            
            {/* Login Error Message */}
            {loginError && (
              <div className="error-message-box">
                {loginError}
              </div>
            )}
            
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
                  onClick={() => {
                    setIsRegistering(true);
                    resetForms();
                  }}
                >
                  Register here
                </button>
              </p>
            </div>
          </>
        ) : (
          // REGISTRATION FORM
          <>
            <h3>Create Student Account</h3>
            
            {/* Registration Success Message */}
            {registerSuccess && (
              <div className="success-message-box">
                <h4>🎉 Account Created Successfully!</h4>
                <pre>{successMessage}</pre>
                <p><small>Redirecting to login in 5 seconds...</small></p>
              </div>
            )}
            
            {/* Registration Error Message */}
            {registerError && !registerSuccess && (
              <div className="error-message-box">
                {registerError}
              </div>
            )}
            
            {!registerSuccess && (
              <form onSubmit={handleRegister}>
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
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Enter your email address"
                  />
                  <small className="help-text">
                    Your Student ID will be sent to this email
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Enter a strong password"
                  />
                  
                  {/* Password Strength Indicator */}
                  {registerData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span 
                        className="strength-label"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  
                  {/* Password Requirements */}
                  <div className="password-requirements">
                    <h4>Password must contain:</h4>
                    <ul>
                      <li className={registerData.password.length >= 8 ? 'valid' : 'invalid'}>
                        At least 8 characters
                      </li>
                      <li className={/(?=.*[a-z])/.test(registerData.password) ? 'valid' : 'invalid'}>
                        One lowercase letter (a-z)
                      </li>
                      <li className={/(?=.*[A-Z])/.test(registerData.password) ? 'valid' : 'invalid'}>
                        One uppercase letter (A-Z)
                      </li>
                      <li className={/(?=.*\d)/.test(registerData.password) ? 'valid' : 'invalid'}>
                        One number (0-9)
                      </li>
                      <li className={/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(registerData.password) ? 'valid' : 'invalid'}>
                        One special character (!@#$%^&* etc.)
                      </li>
                    </ul>
                  </div>
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
                  {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                    <div className="error-message">Passwords do not match</div>
                  )}
                  {registerData.confirmPassword && registerData.password === registerData.confirmPassword && (
                    <div className="success-message">Passwords match!</div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || passwordErrors.length > 0 || registerData.password !== registerData.confirmPassword}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
            
            <div className="auth-switch">
              <p>Already have an account? 
                <button 
                  type="button" 
                  className="link-button"
                  onClick={() => {
                    setIsRegistering(false);
                    resetForms();
                  }}
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
          <p><em>Create your own student account - a unique Student ID will be generated and emailed to you</em></p>
        </div>
      </div>
    </div>
  );
};

export default Login;