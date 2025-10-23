import React, { useState } from 'react';
import studentService from '../services/studentService';

const ExportButton = ({ filters, onExport }) => {
  const [exporting, setExporting] = useState(false);
  const [lastError, setLastError] = useState('');

  // Enhanced export functions with better error handling
  const handleExportCSV = async () => {
    try {
      setLastError('');
      await studentService.exportToCSV(filters);
      if (onExport) {
        onExport('csv');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setLastError(`CSV export failed: ${errorMessage}`);
      throw error; // Re-throw to trigger fallback
    }
  };

  const handleExportPDF = async () => {
    try {
      setLastError('');
      await studentService.exportToPDF(filters);
      if (onExport) {
        onExport('pdf');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setLastError(`PDF export failed: ${errorMessage}`);
      throw error; // Re-throw to trigger fallback
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    setLastError('');
    
    try {
      if (format === 'csv') {
        await handleExportCSV();
      } else if (format === 'pdf') {
        await handleExportPDF();
      }
    } catch (error) {
      console.error('Primary export method failed:', error);
      
      // Check if it's a CORS or network error that might work with iframe
      const isCorsOrNetworkError = 
        error.message?.includes('CORS') || 
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK';
      
      if (isCorsOrNetworkError) {
        console.log('Using iframe fallback method due to CORS/network issue');
        await handleExportIframe(format);
      } else {
        // For other errors, show the message but don't use fallback
        alert(`Export failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setExporting(false);
    }
  };

  // Improved iframe method with better error handling
  const handleExportIframe = (format) => {
    return new Promise((resolve, reject) => {
      try {
        const token = studentService.getToken();
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const params = new URLSearchParams();
        
        // Add all filters
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== '') {
            params.append(key, filters[key]);
          }
        });

        // Use the actual API base URL from studentService
        const API_BASE_URL = studentService.API_BASE_URL || 'http://localhost:5000/students';
        const url = `${API_BASE_URL}/export/${format}?${params}`;
        
        console.log('Export URL:', url);
        
        // Create hidden iframe with unique name
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = `export-frame-${format}-${Date.now()}`;
        document.body.appendChild(iframe);

        // Create form with authorization
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = url;
        form.target = iframe.name;
        
        // Add token as hidden field (for iframe method)
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = token;
        form.appendChild(tokenInput);
        
        document.body.appendChild(form);
        
        // Submit the form
        form.submit();

        // Set up success/error handling
        const cleanup = () => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        };

        // Iframe load handler - assume success if loaded
        iframe.onload = () => {
          console.log(`Export ${format} iframe loaded`);
          cleanup();
          if (onExport) {
            onExport(format);
          }
          resolve();
        };

        // Iframe error handler
        iframe.onerror = () => {
          console.error(`Export ${format} iframe error`);
          cleanup();
          reject(new Error(`Failed to export ${format.toUpperCase()}`));
        };

        // Fallback timeout - clean up after 10 seconds
        setTimeout(() => {
          if (document.body.contains(form) || document.body.contains(iframe)) {
            console.log(`Export ${format} timeout cleanup`);
            cleanup();
            // Don't reject on timeout - assume it might have worked
            resolve();
          }
        }, 10000);

      } catch (error) {
        console.error('Iframe export setup error:', error);
        reject(error);
      }
    });
  };

  // Test PDF generation (for debugging)
  const testPDF = async () => {
    try {
      const response = await fetch('http://localhost:5000/students/test-pdf');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        alert('Test PDF opened in new tab. If this works, PDF generation is functioning.');
      } else {
        alert('Test PDF failed: ' + response.statusText);
      }
    } catch (error) {
      alert('Test PDF failed: ' + error.message);
    }
  };

  return (
    <div className="export-section">
      {/* Error Display */}
      {lastError && (
        <div className="export-error">
          <small style={{ color: 'red' }}>{lastError}</small>
        </div>
      )}
      
      <div className="export-buttons">
        <button 
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="btn-export btn-export-csv"
          title="Export student data as CSV file"
        >
          {exporting ? '📥 Exporting...' : '📊 Export CSV'}
        </button>
        
        <button 
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="btn-export btn-export-pdf"
          title="Export student data as PDF report"
        >
          {exporting ? '📥 Exporting...' : '📄 Export PDF'}
        </button>

        {/* Debug button - remove in production */}
        <button 
          onClick={testPDF}
          className="btn-export btn-export-test"
          title="Test PDF generation (debug)"
          style={{ fontSize: '12px', padding: '5px 10px', marginLeft: '10px' }}
        >
          Test PDF
        </button>
      </div>
      
      <div className="export-info">
        <small>
          <strong>Export includes:</strong>
          {filters.search && ` Search: "${filters.search}"`}
          {filters.major && ` Major: ${filters.major}`}
          {filters.grade && ` Grade: ${filters.grade}`}
          {!filters.search && !filters.major && !filters.grade && ' All students'}
        </small>
        <br />
        <small style={{ color: '#666' }}>
          CSV: Spreadsheet format • PDF: Printable report
        </small>
      </div>

      {/* Export status */}
      {exporting && (
        <div className="export-status">
          <small>Preparing download... (This may take a moment)</small>
        </div>
      )}
    </div>
  );
};

export default ExportButton;