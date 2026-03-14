import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { forgotPasswordRequest, forgotPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      setMessage(res.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to start reset process');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
      const res = await forgotPasswordReset(email, otp, newPassword);
      setMessage(res.message);
      setStep(3); // Success step
    } catch (err) {
      setError(err.message || 'Failed to reset password');
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
            <h1 className="text-2xl font-extrabold mb-2" style={{
              background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Reset Password
            </h1>
            <p style={{ color: 'var(--color-verse-muted)' }} className="text-sm">
              {step === 1 && 'Enter your email to receive an OTP code'}
              {step === 2 && 'Enter the OTP and your new password'}
              {step === 3 && 'Password Reset Complete'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-lg text-sm text-red-300"
              style={{ background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.3)' }}
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-lg text-sm text-green-300"
              style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)' }}
            >
              {message}
            </motion.div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>Account Email</label>
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
                {loading ? 'Sending Code...' : 'Send OTP'}
              </button>
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm hover:underline" style={{ color: 'var(--color-verse-muted)' }}>
                  Cancel and return to Login
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="spider-input text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-verse-muted)' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="spider-input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6 || !newPassword}
                className="spider-btn w-full text-center mt-6"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                className="text-5xl mb-6 mt-4"
              >
                ✅
              </motion.div>
              <Link to="/login" className="spider-btn block w-full">
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
