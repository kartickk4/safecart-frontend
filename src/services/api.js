import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const LIVE_BACKEND_URL = 'https://safecart-backend-1.onrender.com/api/v1';

const getBaseUrl = () => {
  // 1. Mobile Native App Check (Capacitor Android & iOS)
  // Inside the APK, origin is https://localhost or capacitor://localhost with no local backend on phone.
  if (typeof window !== 'undefined') {
    const isCapacitorNative = 
      Capacitor.isNativePlatform() || 
      Boolean(window.Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'capacitor:' ||
      (window.location.origin === 'https://localhost' && (!window.location.port || window.location.port === ''));

    if (isCapacitorNative) {
      return LIVE_BACKEND_URL;
    }
  }

  // 2. Explicit Environment Variable
  let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (url) {
    url = url.trim().replace(/\/+$/, '');
    if (!url.endsWith('/api/v1')) {
      url = `${url}/api/v1`;
    }
    // Prevent using localhost URL if accessing from production domains
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && url.includes('localhost')) {
        return LIVE_BACKEND_URL;
      }
    }
    return url;
  }

  // 3. Web Domain Detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (hostname.includes('onrender.com')) {
        const backendHost = hostname.replace('-frontend', '-backend');
        return `${window.location.protocol}//${backendHost}/api/v1`;
      }
      if (hostname.includes('securekaro.in')) {
        return LIVE_BACKEND_URL;
      }
      return `${window.location.origin}/api/v1`;
    }
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout so requests never hang infinitely
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('securekaro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If a network error occurs in native mobile or deployed domains, auto-retry on live backend
    if (
      (error.code === 'ERR_NETWORK' || !error.response) && 
      typeof window !== 'undefined'
    ) {
      const isMobileApp = 
        Capacitor.isNativePlatform() || 
        Boolean(window.Capacitor?.isNativePlatform?.()) ||
        window.location.protocol === 'capacitor:' ||
        (window.location.origin === 'https://localhost' && (!window.location.port || window.location.port === ''));

      const isLiveDomain = 
        window.location.hostname.includes('onrender.com') || 
        window.location.hostname.includes('securekaro.in');

      if ((isMobileApp || isLiveDomain) && error.config && error.config.baseURL !== LIVE_BACKEND_URL) {
        console.warn(`[Capacitor/Web] Network fallback: redirecting request to ${LIVE_BACKEND_URL}`);
        api.defaults.baseURL = LIVE_BACKEND_URL;
        const retryConfig = { ...error.config, baseURL: LIVE_BACKEND_URL };
        return axios(retryConfig);
      }
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: (credentials, role) => api.post('/auth/login', typeof credentials === 'object' ? { ...credentials, role: credentials.role || role || 'Receiver' } : { email: credentials, password: role, role }),
  signup: (userData) => api.post('/auth/signup', userData),
  sendOtp: (data, role) => api.post('/auth/send-otp', typeof data === 'object' ? { ...data, role: data.role || role || 'Receiver' } : { phone: data, role: role || 'Receiver' }),
  verifyOtp: (phone, code, role) => api.post('/auth/verify-otp', typeof phone === 'object' ? { ...phone, role: phone.role || role || 'Receiver' } : { phone, code, role: role || 'Receiver' }),
  sendEmailOtp: (email, role) => api.post('/auth/send-email-otp', typeof email === 'object' ? { ...email, role: email.role || role || 'Receiver' } : { email, role: role || 'Receiver' }),
  verifyEmailOtp: (email, code, role) => api.post('/auth/verify-email-otp', typeof email === 'object' ? { ...email, role: email.role || role || 'Receiver' } : { email, code, role: role || 'Receiver' }),
  forgotPassword: (email, role) => api.post('/auth/forgot-password', typeof email === 'object' ? { ...email, role: email.role || role || 'Receiver' } : { email, role: role || 'Receiver' }),
  resetPassword: (email, code, newPassword, role) => api.post('/auth/reset-password', typeof email === 'object' ? { ...email, role: email.role || role || 'Receiver' } : { email, code, newPassword, role: role || 'Receiver' }),
  googleLogin: (data) => api.post('/auth/google', data),
  googleAuth: (data) => api.post('/auth/google', data),
  switchRole: (targetRole) => api.post('/auth/switch-role', { targetRole }),
};


export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  upgradeProPlan: () => api.post('/profile/upgrade-pro'),
  getReferralStats: () => api.get('/profile/referral-stats'),
  applyReferralCode: (code) => api.post('/profile/apply-referral', { code }),
  sendPhoneOtp: (phone) => api.post('/profile/send-phone-otp', { phone }),
  verifyPhoneOtp: (phone, otp) => api.post('/profile/verify-phone-otp', { phone, otp }),
};

export const shipmentAPI = {
  getShipments: (role) => api.get('/shipments', { params: role ? { role } : {} }),
  getShipmentById: (id) => api.get(`/shipments/${id}`),
  getTrackingByAwb: (awb) => api.get(`/tracking/${awb}`),
  getPublicTracking: (trackingId, phone) => api.post('/tracking/public', { trackingId, phone }),
  createShipment: (data) => api.post('/shipments', data),
  fundEscrow: (id, data) => api.post(`/shipments/${id}/fund`, data),
  dispatchShipment: (id, data) => api.put(`/shipments/${id}/dispatch`, data),
  releaseEscrow: (id) => api.put(`/shipments/${id}/release`),
  confirmDelivery: (id, choice) => api.put(`/shipments/${id}/confirm-delivery`, { choice }),
  cancelShipment: (id, reason) => api.put(`/shipments/${id}/cancel`, { reason }),
  refundUndelivered: (id, reason) => api.put(`/shipments/${id}/undelivered`, { reason }),
  requestReturn: (id, payload) => api.put(`/shipments/${id}/return-request`, typeof payload === 'string' ? { reason: payload } : (payload || {})),
  closeReturnRequest: (id) => api.put(`/shipments/${id}/return-close`),
  closeReturnWindow: (id) => api.put(`/shipments/${id}/return-window-close`),
  approveReturn: (id, courierData) => api.put(`/shipments/${id}/return-approve`, courierData || {}),
  confirmReturnReceived: (id) => api.put(`/shipments/${id}/return-confirm`),
  offerDiscount: (id, discountAmount) => api.put(`/shipments/${id}/return-offer-discount`, { discountAmount }),
  respondDiscount: (id, accepted) => api.put(`/shipments/${id}/return-respond-discount`, { accepted }),
  approveReplacement: (id, courierData) => api.put(`/shipments/${id}/return-approve-replacement`, courierData || {}),
  rejectReplacement: (id, reason) => api.put(`/shipments/${id}/return-reject-replacement`, { reason }),
  dispatchReplacement: (id, courierData) => api.put(`/shipments/${id}/return-dispatch-replacement`, courierData || {}),
  confirmReplacementDelivery: (id) => api.put(`/shipments/${id}/return-confirm-replacement`),
  simulateDelivered: (id) => api.put(`/shipments/${id}/simulate-delivered`),
  generatePaymentLink: (id) => api.post(`/shipments/${id}/payment-link`),
  toggleReturnAllowed: (id, returnAllowed) => api.put(`/shipments/${id}/toggle-return`, { returnAllowed }),
  getSupplierReturnOrders: () => api.get('/shipments/returns/supplier'),
  getReceiverReturnOrders: () => api.get('/shipments/returns/receiver'),
  getGatewayFeeStatus: () => api.get('/shipments/gateway-fee-status'),
  optInPhotoReview: (id) => api.post(`/shipments/${id}/photo-review-pay`),
  refusePhotoReview: (id) => api.post(`/shipments/${id}/photo-review-refuse`),
  uploadParcelPhoto: (id, parcelPhotoUrl) => api.put(`/shipments/${id}/parcel-photo`, { parcelPhotoUrl }),
  getQrLabel: (id) => api.get(`/shipments/${id}/qr-label`),
  getReplacementQrLabel: (id) => api.get(`/shipments/${id}/replacement-qr-label`),
  publicQrGetInfo: (token) => api.get(`/shipments/public/qr-info/${token}`),
  publicQrSendOtp: (token, payload) => api.post(`/shipments/public/send-otp/${token}`, payload || {}),
  publicQrConfirm: (token, payload) => api.post(`/shipments/public/qr-confirm/${token}`, payload || {}),
  publicPay: (id, data) => api.post(`/shipments/public/pay/${id}`, data || {}),
  generateYoupiLink: (id, data) => api.post(`/shipments/public/youpi-link/${id}`, data || {}),
  getYoupiPaymentStatus: (id) => api.get(`/youpi/payment-status/${id}`),
  simulateYoupiPayment: (id) => api.post(`/youpi/simulate-payment/${id}`),
  getNetworkInfo: () => api.get('/network-info'),
  exportTaxStatementCSV: () => api.get('/shipments/export?format=csv', { responseType: 'blob' }),
  exportTaxStatementJSON: () => api.get('/shipments/export?format=json'),
  quoteCodFees: (data) => api.post('/shipments/quote-cod', data),
};

export const claimAPI = {
  fileClaim: (data) => api.post('/claims', data),
  getClaimByShipment: (shipmentId) => api.get(`/claims/${shipmentId}`),
  getMyClaimsCount: () => api.get('/claims/my-count'),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const rewardAPI = {
  getRewardWallet: () => api.get('/rewards/wallet'),
  withdrawCashback: (data) => api.post('/rewards/withdraw', data),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  createRechargeOrder: (data) => api.post('/wallet/create-order', data),
  verifyPayment: (data) => api.post('/wallet/verify', data),
  // Withdrawals
  // Buyer cashback withdraw: < ₹100 → ₹3 fee deducted
  withdrawBuyer: (data) => api.post('/wallet/buyer/withdraw', data),
  // Seller wallet withdraw: < ₹2,000 → ₹2 fee deducted
  withdrawSeller: (data) => api.post('/wallet/seller/withdraw', data),
};

export const agentAPI = {
  sendMessage: (data) => api.post('/agent/chat', data),
  uploadBulkExcel: (formData) => api.post('/agent/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  confirmBulkBooking: (data) => api.post('/agent/bulk-confirm', data),
  getBulkStatus: (jobId) => api.get(`/agent/bulk-status/${jobId}`),
  // Download the completed booking result as an Excel report
  getBulkReportUrl: (jobId) => `${api.defaults.baseURL}/agent/bulk-report/${jobId}`,
  getCarrierRates: (data) => api.post('/agent/carrier-rates', data),
  getSession: (sessionId) => api.get(`/agent/session/${sessionId}`),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  suspendUser: (id, reason) => api.put(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserVerification: (id, data) => api.put(`/admin/users/${id}/verify`, data),
  updateUserProfile: (id, data) => api.put(`/admin/users/${id}/profile`, data),
  sendDirectNotification: (id, data) => api.post(`/admin/users/${id}/notify`, data),
  adjustUserBalances: (id, data) => api.post(`/admin/users/${id}/adjust-balance`, data),
  getUserTransactions: (id) => api.get(`/admin/users/${id}/transactions`),

  getShipments: (params) => api.get('/admin/shipments', { params }),
  getShipmentById: (id) => api.get(`/admin/shipments/${id}`),
  overrideShipmentStatus: (id, data) => api.put(`/admin/shipments/${id}/override-status`, data),
  cancelShipment: (id, reason) => api.put(`/admin/shipments/${id}/cancel`, { reason }),
  confirmDeliveryManually: (id, notes) => api.put(`/admin/shipments/${id}/confirm-delivery`, { notes }),
  toggleShipmentLock: (id, data) => api.put(`/admin/shipments/${id}/lock`, data),
  editShipmentDetails: (id, data) => api.put(`/admin/shipments/${id}/edit-details`, data),
  manageInboxQr: (id, action) => api.put(`/admin/shipments/${id}/inbox-qr`, { action }),
  forceReleaseEscrow: (id, reason) => api.post(`/admin/shipments/${id}/force-release`, { reason }),
  forceRefundEscrow: (id, reason) => api.post(`/admin/shipments/${id}/force-refund`, { reason }),

  getReturns: (params) => api.get('/admin/returns', { params }),
  overrideReturnStatus: (id, data) => api.put(`/admin/shipments/${id}/return-status`, data),
  forceApproveReturn: (id, data) => api.post(`/admin/shipments/${id}/return-approve`, data),
  forceRejectReturn: (id, reason) => api.post(`/admin/shipments/${id}/return-reject`, { reason }),
  setReturnAwb: (id, data) => api.post(`/admin/shipments/${id}/set-return-awb`, data),
  setReplacementAwb: (id, data) => api.post(`/admin/shipments/${id}/set-replacement-awb`, data),

  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (id, data) => api.post(`/admin/disputes/${id}/resolve`, data),

  getFinancialSummary: () => api.get('/admin/finance/summary'),
  getLiveEscrow: () => api.get('/admin/finance/escrow-live'),
  getWithdrawals: () => api.get('/admin/finance/withdrawals'),
  processWithdrawal: (id, data) => api.post(`/admin/finance/withdrawals/${id}`, data),
  adjustWallet: (data) => api.post('/admin/wallet/adjust', data),

  getSystemConfig: () => api.get('/admin/system/config'),
  updateSystemConfig: (data) => api.put('/admin/system/config', data),
  getBulkJobs: () => api.get('/admin/system/bulk-jobs'),

  broadcastNotification: (data) => api.post('/admin/broadcast', data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  exportData: (type) => api.get(`/admin/export/${type}`),
  exportDataCSV: (type) => api.get(`/admin/export/${type}?format=csv`, { responseType: 'blob' }),
};

export default api;
