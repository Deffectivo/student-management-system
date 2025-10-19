import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/students';

const studentService = {
  getStudents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    const response = await axios.get(`${API_BASE_URL}?${params}`);
    return response.data;
  },

  getStudent: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await axios.post(API_BASE_URL, studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  }
};

export default studentService;