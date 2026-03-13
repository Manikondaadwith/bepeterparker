import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
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
          {/* Logo */}
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
              {step === 1 ? 'Enter the multiverse of knowledge' : 'Check your inbox for the key'}
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
              <button
                type="submit"
                disabled={loading || !email}
                className="spider-btn w-full text-center mt-6"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🕸️</motion.span>
                    Sending Web...
                  </span>
                ) : 'Send Access Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>Security Code (OTP)</label>
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🕸️</motion.span>
                    Verifying...
                  </span>
                ) : 'Enter the Spider-Verse'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm font-medium hover:underline mt-4 tracking-wider"
                style={{ color: 'var(--color-verse-muted)' }}
              >
                &larr; Back to Email
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
