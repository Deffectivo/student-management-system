import React, { useState, useEffect } from 'react';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
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
    sortOrder: 'ASC'
  });

  useEffect(() => {
    loadStudents();
  }, [filters]);

  const loadStudents = async () => {
    try {
      const data = await studentService.getStudents(filters);
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Error loading students. Make sure the backend server is running on port 5000.');
    }
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Management System</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add New Student
        </button>
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
        ) : (
          <StudentList
            students={students}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}
      </main>
    </div>
  );
}

export default App;