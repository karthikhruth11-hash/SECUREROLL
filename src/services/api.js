/**
 * SECURE Platform - Centralized API Client
 */

const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : 'https://secureroll-api.onrender.com/api')
  : 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('secure_platform_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Clear invalid token
        localStorage.removeItem('secure_platform_jwt_token');
        localStorage.removeItem('secure_platform_user');
      }
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`[API FETCH ERROR ${endpoint}]`, err);
    throw err;
  }
};

// Auth API Methods
export const apiLogin = (emailOrCollegeId, password) => apiFetch('/auth/login', { method: 'POST', body: { emailOrCollegeId, password } });
export const apiGetMe = () => apiFetch('/auth/me');
export const apiGetPasskeyRegOptions = () => apiFetch('/auth/passkey/register-options', { method: 'POST' });
export const apiVerifyPasskeyReg = (credential, deviceName) => apiFetch('/auth/passkey/verify-registration', { method: 'POST', body: { credential, deviceName } });
export const apiGetPasskeyAuthOptions = (emailOrCollegeId) => apiFetch('/auth/passkey/auth-options', { method: 'POST', body: { emailOrCollegeId } });
export const apiVerifyPasskeyAuth = (challengeId, credential) => apiFetch('/auth/passkey/verify-auth', { method: 'POST', body: { challengeId, credential } });
export const apiGetSMSStatus = () => apiFetch('/auth/otp/status');
export const apiRequestOTP = (phone) => apiFetch('/auth/otp/request', { method: 'POST', body: { phone } });
export const apiVerifyOTP = (otpInput) => apiFetch('/auth/otp/verify', { method: 'POST', body: { otpInput } });

// Attendance API Methods
export const apiCreateSession = (sessionData) => apiFetch('/attendance/session/create', { method: 'POST', body: sessionData });
export const apiGetActiveSessions = () => apiFetch('/attendance/sessions/active');
export const apiGetSessionToken = (sessionId) => apiFetch(`/attendance/session/${sessionId}/token`);
export const apiMarkAttendance = (sessionId, verificationMethod, qrToken = null) => apiFetch('/attendance/mark', { method: 'POST', body: { sessionId, verificationMethod, qrToken } });
export const apiGetLiveSession = (sessionId) => apiFetch(`/attendance/session/${sessionId}/live`);
export const apiGetAttendanceHistory = () => apiFetch('/attendance/history');

// User & Department API Methods
export const apiGetUsers = () => apiFetch('/users');
export const apiCreateUser = (userData) => apiFetch('/users/create', { method: 'POST', body: userData });
export const apiImportCollegeData = (rows) => apiFetch('/users/import', { method: 'POST', body: { rows } });
export const apiGetDepartments = () => apiFetch('/users/departments');
export const apiGetCourses = () => apiFetch('/users/courses');

// Device & Passkey API Methods
export const apiGetPasskeys = () => apiFetch('/devices/passkeys');
export const apiRevokePasskey = (id) => apiFetch(`/devices/passkey/${id}`, { method: 'DELETE' });
export const apiGetDevices = () => apiFetch('/devices/sessions');
export const apiRevokeAllDevices = () => apiFetch('/devices/revoke-all', { method: 'POST' });

// AI API Methods
export const apiGetAIInsights = () => apiFetch('/ai/insights');
export const apiAIAssistantChat = (query) => apiFetch('/ai/chat', { method: 'POST', body: { query } });
export const apiGetAIPredictions = () => apiFetch('/ai/predictions');
export const apiGetAIAnomalies = () => apiFetch('/ai/anomalies');

// Report & Audit API Methods
export const apiGetReportsSummary = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiFetch(`/reports/summary?${queryStr}`);
};
export const apiGetAuditLogs = () => apiFetch('/audit/logs');
export const apiGetSecurityEvents = () => apiFetch('/audit/security-events');
export const apiGetSystemHealth = () => apiFetch('/audit/health');
