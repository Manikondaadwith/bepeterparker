import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { NotificationService } from '../services/notificationService';

export default function Profile() {
  const { user, logout, changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('loading');
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProfile();
        setProfile(data);
        
        // Initial notification status
        const status = await NotificationService.getPermissionStatus();
        setNotificationStatus(status);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('All fields are required');
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }
      if (passwordData.oldPassword === passwordData.newPassword) {
        throw new Error('New password must be different from old password');
      }

      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    setUsernameLoading(true);

    try {
      if (!newUsername || newUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (newUsername === user.username) {
        throw new Error('New username must be different from current username');
      }

      const result = await api.updateUsername(newUsername);
      setUsernameSuccess('Username changed successfully!');
      setNewUsername('');
      setTimeout(() => {
        setShowChangeUsername(false);
        setUsernameSuccess('');
        window.location.reload();
      }, 2000);
    } catch (err) {
      setUsernameError(err.message || 'Failed to change username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    setNotificationLoading(true);
    try {
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        setNotificationStatus('denied');
        return;
      }
      
      await NotificationService.subscribe();
      setNotificationStatus('granted');
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      alert('Failed to enable notifications. Make sure you are using a secure connection (HTTPS or localhost).');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestPushLoading(true);
    try {
      await api.sendTestPush();
    } catch (err) {
      console.error('Failed to send test push:', err);
      alert('Failed to send test push. Ensure you have enabled notifications first.');
    } finally {
      setTestPushLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  const xp = profile.xpProgress;

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto mobile-safe">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-8 mb-5 sm:mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5"
            style={{ background: 'radial-gradient(circle at 80% 20%, var(--color-spider-red), transparent 50%)' }} />
          <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-5xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
                boxShadow: '0 0 30px rgba(220,20,60,0.3)'
              }}
            >
              🕷️
            </motion.div>
            <div className="text-center sm:text-left min-w-0">
              <h1 className="text-xl sm:text-3xl font-extrabold">{profile.user.username}</h1>
              <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: 'var(--color-verse-muted)' }}>
                {profile.user.email}
              </p>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap justify-center sm:justify-start">
                <span className="text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  ⚡ Level {profile.user.level}
                </span>
                <span className="text-[10px] sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
                  Joined {new Date(profile.user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span>Level {profile.user.level} Progress</span>
              <span style={{ color: 'var(--color-verse-muted)' }}>{Math.floor(xp.currentXp)} / {xp.requiredXp} XP</span>
            </div>
            <div className="xp-bar-container">
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xp.percentage}%` }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-[10px] sm:text-xs mt-2" style={{ color: 'var(--color-verse-muted)' }}>
              Total XP: {profile.user.xp.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-5 sm:mb-8">
          {[
            { icon: '📋', label: 'Quests Done', value: profile.stats.totalQuests, color: '#3B82F6' },
            { icon: '🧠', label: 'Skills', value: profile.stats.totalSkills, color: 'var(--color-spider-purple)' },
            { icon: '🔥', label: 'Current Streak', value: `${profile.user.streak}d`, color: 'var(--color-spider-red-light)' },
            { icon: '🏅', label: 'Best Streak', value: `${profile.user.longest_streak}d`, color: 'var(--color-spider-gold)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card p-3 sm:p-5 text-center"
            >
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Performance Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass-card p-4 sm:p-6 mb-5 sm:mb-8">
          <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">📊 Performance Stats</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)' }}>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>Days Active</p>
              <p className="text-lg sm:text-xl font-bold">{profile.stats.daysSinceJoin}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)' }}>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>Quests/Day</p>
              <p className="text-lg sm:text-xl font-bold">{profile.stats.questsPerDay}</p>
            </div>
          </div>
        </motion.div>

        {/* Top Skills */}
        {profile.topSkills?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass-card p-4 sm:p-6 mb-5 sm:mb-8">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">🏆 Top Skills</h3>
            <div className="space-y-3">
              {profile.topSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <span className="text-base sm:text-lg w-6 sm:w-8 text-center shrink-0">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-semibold text-xs sm:text-sm truncate">{skill.name}</span>
                      <span className="text-[10px] sm:text-xs shrink-0" style={{ color: skill.color || 'var(--color-spider-red)' }}>
                        {skill.xp} XP
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full" style={{ background: 'var(--color-verse-surface)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: skill.color || 'var(--color-spider-red)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (skill.xp / Math.max(...profile.topSkills.map(s => s.xp), 1)) * 100)}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">🎖️ Achievements ({profile.achievements.length})</h3>
          {profile.achievements.length === 0 ? (
            <div className="glass-card p-6 sm:p-8 text-center">
              <p className="text-3xl sm:text-4xl mb-3">🕸️</p>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>Complete quests to unlock achievements</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.achievements.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="glass-card p-3 sm:p-4 text-center"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{ach.icon}</div>
                  <p className="font-bold text-xs sm:text-sm">{ach.name}</p>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{ach.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Active Event */}
        {profile.activeEvent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-4 sm:p-6 mt-5 sm:mt-8"
            style={{ borderLeft: '3px solid var(--color-spider-gold)', background: 'rgba(255,215,0,0.05)' }}
          >
            <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-spider-gold)' }}>{profile.activeEvent.title}</h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>{profile.activeEvent.description}</p>
            <p className="text-[10px] sm:text-xs mt-2" style={{ color: 'var(--color-spider-gold)' }}>
              XP Modifier: {profile.activeEvent.xp_modifier}x
            </p>
          </motion.div>
        )}

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
          className="glass-card p-4 sm:p-6 mb-5 sm:mb-8">
          <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">🔔 Notification Settings</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">Web Push Notifications</p>
              <p className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                {notificationStatus === 'granted' 
                  ? 'Notifications are enabled on this device.' 
                  : notificationStatus === 'denied'
                  ? 'Notifications are blocked. Please reset permissions in your browser.'
                  : 'Get real-time alerts for new quests and events.'}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {notificationStatus !== 'granted' ? (
                <button
                  onClick={handleEnableNotifications}
                  disabled={notificationLoading || notificationStatus === 'unsupported'}
                  className="flex-1 sm:flex-initial px-6 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
                    color: 'white',
                    cursor: notificationStatus === 'unsupported' ? 'not-allowed' : 'pointer',
                    opacity: (notificationLoading || notificationStatus === 'unsupported') ? 0.5 : 1
                  }}
                >
                  {notificationLoading ? 'Enabling...' : 'Enable Notifications'}
                </button>
              ) : (
                <button
                  onClick={handleSendTestPush}
                  disabled={testPushLoading}
                  className="flex-1 sm:flex-initial px-6 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
                  style={{
                    background: 'rgba(255,215,0,0.2)',
                    color: 'var(--color-spider-gold)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    cursor: 'pointer',
                    opacity: testPushLoading ? 0.5 : 1
                  }}
                >
                  {testPushLoading ? 'Sending...' : 'Send Test Mission'}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Change Username & Password & Logout Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.9 }}
          className="flex gap-3 sm:gap-4 mt-5 sm:mt-8 flex-col sm:flex-row"
        >
          <button
            onClick={() => setShowChangeUsername(true)}
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all"
            style={{ 
              background: 'rgba(124,58,237,0.2)', 
              color: '#A78BFA',
              border: '1px solid rgba(124,58,237,0.3)',
              cursor: 'pointer'
            }}
          >
            👤 Change Username
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all"
            style={{ 
              background: 'rgba(255,215,0,0.2)', 
              color: 'var(--color-spider-gold)',
              border: '1px solid rgba(255,215,0,0.3)',
              cursor: 'pointer'
            }}
          >
            🔐 Change Password
          </button>
          <button
            onClick={logout}
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all"
            style={{ 
              background: 'rgba(220,20,60,0.2)', 
              color: 'var(--color-spider-red-light)',
              border: '1px solid rgba(220,20,60,0.3)',
              cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
        </motion.div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChangePassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 sm:p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">🔐 Change Password</h2>

              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 rounded-lg text-sm text-red-300"
                  style={{ background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.3)' }}
                >
                  {passwordError}
                </motion.div>
              )}

              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 rounded-lg text-sm text-green-300"
                  style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)' }}
                >
                  {passwordSuccess}
                </motion.div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="spider-input"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="spider-input"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="spider-input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{ background: 'var(--color-verse-surface)', color: 'var(--color-verse-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
                      color: 'white',
                    }}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Change Username Modal */}
        {showChangeUsername && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChangeUsername(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 sm:p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">👤 Change Username</h2>

              {usernameError && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 rounded-lg text-sm text-red-300"
                  style={{ background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.3)' }}
                >
                  {usernameError}
                </motion.div>
              )}

              {usernameSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 rounded-lg text-sm text-green-300"
                  style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)' }}
                >
                  {usernameSuccess}
                </motion.div>
              )}

              <form onSubmit={handleChangeUsernameSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                    Current Username
                  </label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="spider-input opacity-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="spider-input"
                    placeholder="Enter new username (min 3 characters)"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangeUsername(false);
                      setNewUsername('');
                      setUsernameError('');
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{ background: 'var(--color-verse-surface)', color: 'var(--color-verse-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={usernameLoading}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-spider-purple), #A78BFA)',
                      color: 'white',
                    }}
                  >
                    {usernameLoading ? 'Updating...' : 'Update Username'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
