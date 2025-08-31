import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sgmi_auth_token');
    if (token) {
      try {
        const tokenData = JSON.parse(token);
        config.headers.Authorization = `Bearer ${tokenData.accessToken}`;
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      localStorage.removeItem('sgmi_auth_token');
      localStorage.removeItem('sgmi_auth_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);