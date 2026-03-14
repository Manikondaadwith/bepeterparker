import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupRequest, signupVerify } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupRequest(formData.email, formData.password, formData.username);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to start signup process');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signupVerify(formData.email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
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
              🕸️
            </motion.div>
            <h1 className="text-3xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Join Spider-Verse
            </h1>
            <p style={{ color: 'var(--color-verse-muted)' }} className="text-sm">
              {step === 1 ? 'Create your account' : 'Check your inbox for the OTP key'}
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

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="spider-input py-2"
                  placeholder="Peter Parker"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="spider-input py-2"
                  placeholder="peter@dailybugle.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="spider-input py-2"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password || !formData.username}
                className="spider-btn w-full text-center mt-6"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending Verification...' : 'Create Account'}
              </button>
              
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm hover:underline" style={{ color: 'var(--color-verse-muted)' }}>
                  Already have an account? Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>Verification Code (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="spider-input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="spider-btn w-full text-center mt-6"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Verifying...' : 'Complete Signup'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm font-medium hover:underline mt-4 tracking-wider"
                style={{ color: 'var(--color-verse-muted)' }}
              >
                &larr; Back to Details
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
