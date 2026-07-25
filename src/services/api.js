import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safecart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  sendOtp: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  sendEmailOtp: (email) => api.post('/auth/send-email-otp', { email }),
  verifyEmailOtp: (email, code) => api.post('/auth/verify-email-otp', { email, code }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

export const shipmentAPI = {
  getShipments: () => api.get('/shipments'),
  getShipmentById: (id) => api.get(`/shipments/${id}`),
  getTrackingByAwb: (awb) => api.get(`/tracking/${awb}`),
  createShipment: (data) => api.post('/shipments', data),
  fundEscrow: (id, data) => api.post(`/shipments/${id}/fund`, data),
  releaseEscrow: (id) => api.put(`/shipments/${id}/release`),
};

export const claimAPI = {
  fileClaim: (data) => api.post('/claims', data),
  getClaimByShipment: (shipmentId) => api.get(`/claims/${shipmentId}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api;
