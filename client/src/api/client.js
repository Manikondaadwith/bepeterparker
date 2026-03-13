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
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  requestOtp: (email) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
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
