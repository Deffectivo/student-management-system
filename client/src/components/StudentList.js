import React from 'react';

const StudentList = ({ students, onEdit, onDelete, filters, onFilterChange }) => {
  if (students.length === 0) {
    return <div className="no-students">No students found.</div>;
  }

  return (
    <div className="student-list">
      <div className="filters">
        <select 
          value={filters.major || ''} 
          onChange={(e) => onFilterChange('major', e.target.value)}
        >
          <option value="">All Majors</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Engineering">Engineering</option>
          <option value="Business">Business</option>
          <option value="Arts">Arts</option>
        </select>

        <select 
          value={filters.grade || ''} 
          onChange={(e) => onFilterChange('grade', e.target.value)}
        >
          <option value="">All Grades</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>

        <select 
          value={filters.sortBy || ''} 
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="age">Age</option>
          <option value="major">Major</option>
          <option value="grade">Grade</option>
        </select>

        <select 
          value={filters.sortOrder || 'ASC'} 
          onChange={(e) => onFilterChange('sortOrder', e.target.value)}
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>

      <div className="students-grid">
        {students.map(student => (
          <div key={student.id} className="student-card">
            <h3>{student.name}</h3>
            <p><strong>Age:</strong> {student.age}</p>
            <p><strong>Major:</strong> {student.major}</p>
            <p><strong>Grade:</strong> <span className={`grade grade-${student.grade}`}>{student.grade}</span></p>
            <div className="student-actions">
              <button 
                onClick={() => onEdit(student)}
                className="btn-edit"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(student.id)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentList;