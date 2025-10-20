import React from 'react';

const StudentDashboard = ({ student, marks }) => {
  if (!student) {
    return <div>No student data available</div>;
  }

  const calculateStats = () => {
    if (!marks || marks.length === 0) {
      return null;
    }

    const stats = {
      totalTests: marks.length,
      averagePercentage: 0,
      bestSubject: '',
      worstSubject: '',
      recentTests: marks.slice(0, 5),
      subjectAverages: {}
    };

    // Calculate subject averages
    marks.forEach(mark => {
      const percentage = (mark.marks_obtained / mark.total_marks) * 100;
      if (!stats.subjectAverages[mark.subject]) {
        stats.subjectAverages[mark.subject] = { total: 0, count: 0 };
      }
      stats.subjectAverages[mark.subject].total += percentage;
      stats.subjectAverages[mark.subject].count += 1;
    });

    // Calculate overall average
    const totalPercentage = marks.reduce((sum, mark) => {
      return sum + (mark.marks_obtained / mark.total_marks) * 100;
    }, 0);
    stats.averagePercentage = (totalPercentage / marks.length).toFixed(2);

    // Add search state and handler to StudentDashboard
const [searchTerm, setSearchTerm] = useState('');

const filteredMarks = marks.filter(mark => 
  mark.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mark.subject.toLowerCase().includes(searchTerm.toLowerCase())
);

// Add search bar in the return statement
<div className="search-section">
  <SearchBar 
    onSearch={setSearchTerm} 
    placeholder="Search tests by name or subject..." 
  />
</div>

    // Find best and worst subjects
    let bestAvg = 0;
    let worstAvg = 100;
    Object.keys(stats.subjectAverages).forEach(subject => {
      const avg = stats.subjectAverages[subject].total / stats.subjectAverages[subject].count;
      stats.subjectAverages[subject].average = avg.toFixed(2);
      
      if (avg > bestAvg) {
        bestAvg = avg;
        stats.bestSubject = subject;
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        stats.worstSubject = subject;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {student.name}!</h2>
        <div className="student-info">
          <p><strong>Student ID:</strong> {student.id}</p>
          <p><strong>Major:</strong> {student.major}</p>
          <p><strong>Current Grade:</strong> <span className={`grade grade-${student.grade}`}>{student.grade}</span></p>
        </div>
      </div>

      {stats ? (
        <div className="dashboard-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Overall Performance</h3>
              <div className="stat-value">{stats.averagePercentage}%</div>
              <div className="stat-label">Average Score</div>
            </div>
            
            <div className="stat-card">
              <h3>Tests Taken</h3>
              <div className="stat-value">{stats.totalTests}</div>
              <div className="stat-label">Total Tests</div>
            </div>
            
            <div className="stat-card">
              <h3>Best Subject</h3>
              <div className="stat-value">{stats.bestSubject}</div>
              <div className="stat-label">Highest Average</div>
            </div>
            
            <div className="stat-card">
              <h3>Needs Improvement</h3>
              <div className="stat-value">{stats.worstSubject}</div>
              <div className="stat-label">Focus Area</div>
            </div>
          </div>

          <div className="subject-breakdown">
            <h3>Subject Averages</h3>
            <div className="subject-list">
              {Object.keys(stats.subjectAverages).map(subject => (
                <div key={subject} className="subject-item">
                  <span className="subject-name">{subject}</span>
                  <span className="subject-average">
                    {stats.subjectAverages[subject].average}%
                  </span>
                  <span className={`grade grade-${getGradeFromPercentage(stats.subjectAverages[subject].average)}`}>
                    {getGradeFromPercentage(stats.subjectAverages[subject].average)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-tests">
            <h3>Recent Tests</h3>
            <div className="tests-table">
              <table>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTests.map(test => {
                    const percentage = ((test.marks_obtained / test.total_marks) * 100).toFixed(2);
                    const grade = getGradeFromPercentage(percentage);
                    return (
                      <tr key={test.id}>
                        <td>{test.test_name}</td>
                        <td>{test.subject}</td>
                        <td>{test.marks_obtained}/{test.total_marks}</td>
                        <td>{percentage}%</td>
                        <td className={`grade grade-${grade}`}>{grade}</td>
                        <td>{new Date(test.test_date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <h3>No Test Data Available</h3>
          <p>You haven't taken any tests yet. Test marks will appear here once they are recorded by your instructors.</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;