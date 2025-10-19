import React, { useState, useEffect } from 'react';

const StudentForm = ({ student, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    major: '',
    grade: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        age: student.age || '',
        major: student.major || '',
        grade: student.grade || ''
      });
    }
  }, [student]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.major || !formData.grade) {
      alert('Please fill in all fields');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="student-form">
      <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Age:</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="16"
            max="100"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Major:</label>
          <select
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
          >
            <option value="">Select Major</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Grade:</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            required
          >
            <option value="">Select Grade</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {student ? 'Update' : 'Add'} Student
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;