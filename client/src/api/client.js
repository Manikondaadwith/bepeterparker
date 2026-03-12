const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('spiderverse_token');
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
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
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
