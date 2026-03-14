import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import './index.css';

// Lazy load heavy pages (D3 is ~300KB, quest page is large)
const QuestPage = lazy(() => import('./pages/QuestPage'));
const SkillMap = lazy(() => import('./pages/SkillMap'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="page-container flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🕷️</div>
        <p style={{ color: 'var(--color-verse-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <>
      {user && <Navbar />}
      <div className="web-overlay" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/quests" element={<ProtectedRoute><QuestPage /></ProtectedRoute>} />
          <Route path="/skills" element={<ProtectedRoute><SkillMap /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </Suspense>
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
