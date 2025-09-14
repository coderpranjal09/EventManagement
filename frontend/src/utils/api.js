import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (userData) => api.post('/auth/signup', userData),
  getMe: () => api.get('/auth/me'),
};

// Events API
export const eventsAPI = {
  getEvents: () => api.get('/events'),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  assignMembers: (id, memberIds) => api.put(`/events/${id}/assign-members`, { memberIds }),
};

// Registrations API
export const registrationsAPI = {
  registerForEvent: (eventId, registrationData) => 
    api.post(`/registrations/events/${eventId}/register`, registrationData),
  getUserRegistrations: (userId) => 
    api.get(`/registrations/users/${userId}/registrations`),
  getEventRegistrations: (eventId) => 
    api.get(`/registrations/events/${eventId}/registrations`),
};

// Verification API
export const verificationAPI = {
  verifyQR: (qrCode) => api.post('/verify/verify', { qrCode }),
  markAttendance: (attendanceData) => api.post('/verify/attendance', attendanceData),
  getAttendance: (registrationId) => api.get(`/verify/attendance/${registrationId}`),
};

// Scores API
export const scoresAPI = {
  submitScore: (scoreData) => api.post('/scores', scoreData),
  getEventScores: (eventId) => api.get(`/scores/event/${eventId}`),
  getRegistrationScores: (registrationId) => api.get(`/scores/registration/${registrationId}`),
};

// Committee API
export const committeeAPI = {
  getDashboard: (id) => api.get(`/committee/${id}/dashboard`),
  getCommittees: () => api.get('/committee'),
  createCommittee: (committeeData) => api.post('/committee', committeeData),
  updateCommittee: (id, committeeData) => api.put(`/committee/${id}`, committeeData),
  deleteCommittee: (id) => api.delete(`/committee/${id}`),
  getMine: () => api.get('/committee/mine'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  exportParticipants: (eventId) => api.get(`/admin/export/participants?eventId=${eventId || ''}`),
  exportAttendance: (eventId) => api.get(`/admin/export/attendance?eventId=${eventId || ''}`),
  listUsers: () => api.get('/admin/users'),
  updateUser: (userId, payload) => api.put(`/admin/users/${userId}`, payload),
  updateUserRole: (userId, role, committeeId) => api.put(`/admin/users/${userId}/role`, { role, committeeId }),
  assignUserToCommittee: (userId, committeeId) => api.put(`/admin/users/${userId}/committee`, { committeeId }),
  removeUserFromCommittee: (userId) => api.delete(`/admin/users/${userId}/committee`),
  blockUser: (userId, isBlocked) => api.put(`/admin/users/${userId}/block`, { isBlocked }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  searchRegistrations: (params) => api.get('/admin/registrations', { params }),
};

// Coordinator API
export const coordinatorAPI = {
  getCommittee: () => api.get('/coordinator/committee'),
  addMember: (committeeId, userId) => api.post(`/coordinator/${committeeId}/members`, { userId }),
  removeMember: (committeeId, memberId) => api.delete(`/coordinator/${committeeId}/members/${memberId}`),
  updateMemberRole: (committeeId, memberId, role) => api.put(`/coordinator/${committeeId}/members/${memberId}/role`, { role }),
  getDashboard: () => api.get('/coordinator/dashboard'),
  getReports: () => api.get('/coordinator/reports'),
  getAvailableMembers: (committeeId) => 
    committeeId 
      ? api.get(`/coordinator/${committeeId}/members/available`)
      : api.get('/coordinator/members/available'),
  searchRegistrations: (params) => api.get('/coordinator/registrations', { params }),
};

// Member API
export const memberAPI = {
  getCommittee: () => api.get('/member/committee'),
  getDashboard: () => api.get('/member/dashboard'),
  getReports: () => api.get('/member/reports'),
  searchRegistrations: (params) => api.get('/member/registrations', { params }),
};

export default api;