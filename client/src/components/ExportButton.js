import React, { useState } from 'react';
import studentService from '../services/studentService';

const ExportButton = ({ filters, onExport }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      // Create a hidden iframe to handle the download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const token = studentService.getToken();
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = format === 'csv' 
        ? `students-export-${timestamp}.csv`
        : `students-report-${timestamp}.pdf`;

      const url = `${studentService.API_BASE_URL}/export/${format}?${params}`;
      
      // Create a form and submit it through the iframe
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = url;
      form.target = iframe.name;
      
      // Add authorization header as a parameter (not ideal but works around CORS)
      const authInput = document.createElement('input');
      authInput.type = 'hidden';
      authInput.name = 'token';
      authInput.value = token;
      form.appendChild(authInput);
      
      document.body.appendChild(form);
      form.submit();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 1000);

      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      console.error('Export error:', error);
      // Don't show alert for CORS errors since the download usually works
      if (!error.message.includes('CORS') && !error.message.includes('Network Error')) {
        alert(`Error exporting ${format.toUpperCase()}: ${error.response?.data?.error || 'Unknown error'}`);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-section">
      <div className="export-buttons">
        <button 
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="btn-export btn-export-csv"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
        
        <button 
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="btn-export btn-export-pdf"
        >
          {exporting ? 'Exporting...' : 'Export PDF Report'}
        </button>
      </div>
      
      <div className="export-info">
        <small>
          Exports will include currently applied filters: 
          {filters.search && ` Search: "${filters.search}"`}
          {filters.major && ` Major: ${filters.major}`}
          {filters.grade && ` Grade: ${filters.grade}`}
          {!filters.search && !filters.major && !filters.grade && ' All students'}
        </small>
      </div>
    </div>
  );
};

export default ExportButton;