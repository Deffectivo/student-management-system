import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';

const StudentMarks = ({ student, onClose }) => {
  const [marks, setMarks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    test_name: '',
    subject: '',
    marks_obtained: '',
    total_marks: '',
    test_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadMarks();
    loadSubjects();
  }, [student]);

  const loadMarks = async () => {
    try {
      const data = await studentService.getStudentMarks(student.id);
      setMarks(data);
    } catch (error) {
      console.error('Error loading marks:', error);
      alert('Error loading marks');
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await studentService.getAllSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    try {
      await studentService.addStudentMarks(student.id, formData);
      setShowAddForm(false);
      setFormData({
        test_name: '',
        subject: '',
        marks_obtained: '',
        total_marks: '',
        test_date: new Date().toISOString().split('T')[0]
      });
      loadMarks();
      alert('Marks added successfully!');
    } catch (error) {
      console.error('Error adding marks:', error);
      alert('Error adding marks');
    }
  };

  const calculatePercentage = (obtained, total) => {
    return ((obtained / total) * 100).toFixed(2);
  };

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="marks-management">
      <div className="marks-header">
        <h2>Test Marks - {student.name}</h2>
        <div className="marks-actions">
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add Test Marks
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-marks-form">
          <h3>Add Test Marks</h3>
          <form onSubmit={handleAddMarks}>
            <div className="form-row">
              <div className="form-group">
                <label>Test Name:</label>
                <input
                  type="text"
                  value={formData.test_name}
                  onChange={(e) => setFormData({...formData, test_name: e.target.value})}
                  required
                  placeholder="e.g., Midterm Exam, Quiz 1"
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  list="subjects"
                  required
                  placeholder="e.g., Mathematics, Physics"
                />
                <datalist id="subjects">
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Marks Obtained:</label>
                <input
                  type="number"
                  value={formData.marks_obtained}
                  onChange={(e) => setFormData({...formData, marks_obtained: e.target.value})}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Marks:</label>
                <input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({...formData, total_marks: e.target.value})}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Test Date:</label>
                <input
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => setFormData({...formData, test_date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Add Marks</button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="marks-list">
        <h3>Test History</h3>
        {marks.length === 0 ? (
          <p className="no-marks">No test marks recorded yet.</p>
        ) : (
          <div className="marks-table">
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark) => {
                  const percentage = calculatePercentage(mark.marks_obtained, mark.total_marks);
                  const grade = getGradeFromPercentage(percentage);
                  return (
                    <tr key={mark.id}>
                      <td>{mark.test_name}</td>
                      <td>{mark.subject}</td>
                      <td>{mark.marks_obtained}/{mark.total_marks}</td>
                      <td>{percentage}%</td>
                      <td className={`grade grade-${grade}`}>{grade}</td>
                      <td>{new Date(mark.test_date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMarks;