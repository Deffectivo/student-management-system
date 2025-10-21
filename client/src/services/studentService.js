import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/students';

const studentService = {
  getStudents: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${API_BASE_URL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  getStudent: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  createStudent: async (studentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_BASE_URL, studentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  updateStudent: async (id, studentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/${id}`, studentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  deleteStudent: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Marks-related methods
  getStudentMarks: async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/${studentId}/marks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching student marks:', error);
      throw error;
    }
  },

  addStudentMarks: async (studentId, marksData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/${studentId}/marks`, marksData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding student marks:', error);
      throw error;
    }
  },

  getAllSubjects: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/marks/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  // Registration method with email
register: async (username, password, email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      username,
      password,
      email
    });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
},

  // Search students across all fields
  searchStudents: async (searchTerm, filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Add search term
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Add existing filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${API_BASE_URL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  // Authentication methods
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  // ========== EXPORT METHODS ==========

  // Export to CSV
  exportToCSV: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${API_BASE_URL}/export/csv?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  },

  // Export to PDF
  exportToPDF: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`${API_BASE_URL}/export/pdf?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  },

  // Get statistics for dashboard
  getStatistics: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/export/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
};

export default studentService;