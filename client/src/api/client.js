// Use VITE_API_URL env var for deployed/mobile builds, fallback to '/api' for local dev
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth token — uses localStorage for web, can be swapped for
// SecureStorage in a Capacitor mobile build later.
function getToken() {
  try {
    return localStorage.getItem('spiderverse_token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem('spiderverse_token', token);
  } catch { /* noop – mobile fallback handled by app */ }
}

export function removeToken() {
  try {
    localStorage.removeItem('spiderverse_token');
  } catch { /* noop */ }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const rawBody = await res.text();
  let data = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { error: rawBody };
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // Auth
  signupRequest: (email, password, username) => request('/auth/signup-request', { method: 'POST', body: JSON.stringify({ email, password, username }) }),
  signupVerify: (email, otp) => request('/auth/signup-verify', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  forgotPasswordRequest: (email) => request('/auth/forgot-password-request', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPasswordReset: (email, otp, newPassword) => request('/auth/forgot-password-reset', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  changePassword: (oldPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  updateUsername: (username) => request('/auth/username', { method: 'PUT', body: JSON.stringify({ username }) }),
  getMe: () => request('/auth/me'),

  // Quests
  getDailyQuests: () => request('/quests/daily'),
  completeQuest: (id) => request(`/quests/${id}/complete`, { method: 'POST' }),
  getQuestHistory: () => request('/quests/history'),

  // Skills
  getSkills: () => request('/skills'),

  // Profile
  getProfile: () => request('/profile'),
};
