import React, { useState } from 'react';
import StudentMarks from './StudentMarks';
import SearchBar from './SearchBar';
import ExportButton from './ExportButton';

const StudentList = ({ students, onEdit, onDelete, filters, onFilterChange, onSearch }) => {
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);

  // Highlight search terms in student data
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const handleExportSuccess = (format) => {
    console.log(`Successfully exported ${format}`);
  };

  if (students.length === 0) {
    return (
      <div className="student-list">
        <div className="search-section">
          <SearchBar onSearch={onSearch} placeholder="Search by name, major, grade, or age..." />
        </div>
        <ExportButton filters={filters} onExport={handleExportSuccess} />
        <div className="no-students">
          No students found. Try adjusting your search or filters.
        </div>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="search-section">
        <SearchBar onSearch={onSearch} placeholder="Search by name, major, grade, or age..." />
      </div>

      <ExportButton filters={filters} onExport={handleExportSuccess} />

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

      <div className="search-info">
        <p>Found {students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="students-grid">
        {students.map(student => (
          <div key={student.id} className="student-card">
            <h3>{highlightText(student.name, filters.search)}</h3>
            <p><strong>Age:</strong> {highlightText(student.age.toString(), filters.search)}</p>
            <p><strong>Major:</strong> {highlightText(student.major, filters.search)}</p>
            <p><strong>Grade:</strong> <span className={`grade grade-${student.grade}`}>
              {highlightText(student.grade, filters.search)}
            </span></p>
            <div className="student-actions">
              <button 
                onClick={() => onEdit(student)}
                className="btn-edit"
              >
                Edit
              </button>
              <button 
                onClick={() => setSelectedStudentForMarks(student)}
                className="btn-marks"
              >
                Marks
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

      {selectedStudentForMarks && (
        <StudentMarks 
          student={selectedStudentForMarks}
          onClose={() => setSelectedStudentForMarks(null)}
        />
      )}
    </div>
  );
};

export default StudentList;