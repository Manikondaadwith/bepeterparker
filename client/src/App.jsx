import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import QuestPage from './pages/QuestPage';
import SkillMap from './pages/SkillMap';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-verse-bg)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🕷️</div>
          <p style={{ color: 'var(--color-verse-muted)' }}>Loading Spider-Verse...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-verse-bg)' }}>
        <div className="text-5xl animate-bounce">🕷️</div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <div className="web-overlay" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quests" element={<ProtectedRoute><QuestPage /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><SkillMap /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
