import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/me', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  setupAdmin: (data) => api.post('/api/auth/setup-admin', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/api/users', { params }),
  getById: (id) => api.get(`/api/users/${id}`),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
  updateRole: (id, role) => api.put(`/api/users/${id}/role`, { role }),
  getStats: () => api.get('/api/users/stats'),
};

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/api/projects', { params }),
  getById: (id) => api.get(`/api/projects/${id}`),
  create: (data) => api.post('/api/projects', data),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  addMember: (id, data) => api.post(`/api/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/api/projects/${id}/members/${userId}`),
};

// Tasks API
export const tasksAPI = {
  getMyTasks: (params) => api.get('/api/tasks/my-tasks', { params }),
  getProjectTasks: (projectId, params) => api.get(`/api/tasks/project/${projectId}`, { params }),
  getByProject: (projectId, params) => api.get(`/api/tasks/project/${projectId}`, { params }),
  getById: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  getInfo: () => api.get('/'),
};

export default api; 