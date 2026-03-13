import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, removeToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token;
    try { token = localStorage.getItem('spiderverse_token'); } catch { token = null; }
    if (token) {
      api.getMe()
        .then(data => setUser(data.user))
        .catch(() => {
          removeToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const requestOtp = async (email) => {
    return await api.requestOtp(email);
  };

  const verifyOtp = async (email, otp) => {
    const data = await api.verifyOtp(email, otp);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}
