import React, { useState, useEffect } from 'react';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import studentService from './services/studentService';
import './App.css';

function App() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filters, setFilters] = useState({
    major: '',
    grade: '',
    sortBy: '',
    sortOrder: 'ASC',
    search: '' // Add search term
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentMarks, setStudentMarks] = useState([]);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = studentService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadStudents();
      if (user.role === 'student' && user.studentId) {
        loadStudentMarks();
      }
    }
  }, [filters, user]);

const loadStudents = async () => {
  try {
    const data = await studentService.getStudents(filters);
    setStudents(data);
  } catch (error) {
    console.error('Error loading students:', error);
    
    // Handle token expiration specifically
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('Token expired or invalid, logging out...');
      handleLogout();
    } else {
      alert('Error loading students. Make sure the backend server is running on port 5000.');
    }
  }
};

  const loadStudentMarks = async () => {
    try {
      const marks = await studentService.getStudentMarks(user.studentId);
      setStudentMarks(marks);
    } catch (error) {
      console.error('Error loading student marks:', error);
    }
  };

  // Add search handler function
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm
    }));
  };

  const handleLogin = () => {
    const currentUser = studentService.getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = () => {
    studentService.logout();
    setUser(null);
    setStudents([]);
    setStudentMarks([]);
  };

  const handleSaveStudent = async (studentData) => {
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, studentData);
      } else {
        await studentService.createStudent(studentData);
      }
      setShowForm(false);
      setEditingStudent(null);
      loadStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student');
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.deleteStudent(id);
        loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Get the current student for the dashboard (if user is a student)
  const currentStudent = user.role === 'student' 
    ? students.find(s => s.id === user.studentId) 
    : null;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1>Student Management System</h1>
          <div className="user-info">
            Welcome, {user.username} ({user.role})
          </div>
        </div>
        
        <div className="header-actions">
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add New Student
            </button>
          )}
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main>
        {showForm ? (
          <StudentForm
            student={editingStudent}
            onSave={handleSaveStudent}
            onCancel={() => {
              setShowForm(false);
              setEditingStudent(null);
            }}
          />
        ) : user.role === 'student' ? (
          <StudentDashboard 
            student={currentStudent}
            marks={studentMarks}
          />
        ) : (
          <StudentList
            students={students}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />
        )}
      </main>
    </div>
  );
}

export default App;