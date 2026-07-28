import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.includes('onrender.com')) {
      const backendHost = window.location.hostname.replace(/-frontend(-\d+)?/, '-backend');
      return `${window.location.protocol}//${backendHost}/api/v1`;
    }
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getBaseUrl();

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

// Response interceptor to handle Network Error gracefully with live Render fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ERR_NETWORK' && api.defaults.baseURL && api.defaults.baseURL.includes('localhost')) {
      const renderBackendUrl = 'https://safecart-backend.onrender.com/api/v1';
      console.warn(`Local backend offline. Retrying request against live Render API: ${renderBackendUrl}`);
      api.defaults.baseURL = renderBackendUrl;
      const config = error.config;
      config.baseURL = renderBackendUrl;
      return axios(config);
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  sendOtp: (data) => api.post('/auth/send-otp', typeof data === 'object' ? data : { phone: data }),
  verifyOtp: (phone, code) => api.post('/auth/verify-otp', typeof phone === 'object' ? phone : { phone, code }),
  sendEmailOtp: (email) => api.post('/auth/send-email-otp', typeof email === 'object' ? email : { email }),
  verifyEmailOtp: (email, code) => api.post('/auth/verify-email-otp', typeof email === 'object' ? email : { email, code }),
  forgotPassword: (email) => api.post('/auth/forgot-password', typeof email === 'object' ? email : { email }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', typeof email === 'object' ? email : { email, code, newPassword }),
  googleLogin: (data) => api.post('/auth/google', data),
  googleAuth: (data) => api.post('/auth/google', data),
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
  cancelShipment: (id, reason) => api.put(`/shipments/${id}/cancel`, { reason }),
  refundUndelivered: (id, reason) => api.put(`/shipments/${id}/undelivered`, { reason }),
  requestReturn: (id, reason) => api.put(`/shipments/${id}/return-request`, { reason }),
  approveReturn: (id) => api.put(`/shipments/${id}/return-approve`),
  confirmReturnReceived: (id) => api.put(`/shipments/${id}/return-confirm`),
  generatePaymentLink: (id) => api.post(`/shipments/${id}/payment-link`),
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
