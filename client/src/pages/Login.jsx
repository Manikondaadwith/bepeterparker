import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="web-overlay" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4 sm:px-0"
      >
        <div className="glass-card p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl sm:text-6xl mb-3 sm:mb-4"
            >
              🕷️
            </motion.div>
            <h1 className="text-3xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Spider-Verse Quest
            </h1>
            <p style={{ color: 'var(--color-verse-muted)' }} className="text-sm">
              Enter the multiverse of knowledge
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-lg text-sm text-red-300"
              style={{ background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.3)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="spider-input"
                placeholder="peter@dailybugle.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--color-verse-muted)' }}>Password</label>
                <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: 'var(--color-spider-red-light)' }}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="spider-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="spider-btn w-full text-center mt-6"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🕸️</motion.span>
                  Logging in...
                </span>
              ) : 'Enter the Spider-Verse'}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-gray-800">
              <span className="text-sm" style={{ color: 'var(--color-verse-muted)' }}>Need an account? </span>
              <Link to="/signup" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-spider-red-light)' }}>
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
