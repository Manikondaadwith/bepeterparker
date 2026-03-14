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

  const signupRequest = async (email, password, username) => {
    return await api.signupRequest(email, password, username);
  };

  const signupVerify = async (email, otp) => {
    const data = await api.signupVerify(email, otp);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const forgotPasswordRequest = async (email) => {
    return await api.forgotPasswordRequest(email);
  };

  const forgotPasswordReset = async (email, otp, newPassword) => {
    return await api.forgotPasswordReset(email, otp, newPassword);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await api.changePassword(oldPassword, newPassword);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, 
      signupRequest, signupVerify, login, 
      forgotPasswordRequest, forgotPasswordReset, changePassword,
      logout, updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}
