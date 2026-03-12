import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: 'var(--color-verse-bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  const xp = profile.xpProgress;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4" style={{ background: 'var(--color-verse-bg)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5"
            style={{ background: 'radial-gradient(circle at 80% 20%, var(--color-spider-red), transparent 50%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-dark))',
                boxShadow: '0 0 30px rgba(220,20,60,0.3)'
              }}
            >
              🕷️
            </motion.div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold">{profile.user.username}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>
                {profile.user.email}
              </p>
              <div className="flex items-center gap-4 mt-3 flex-wrap justify-center md:justify-start">
                <span className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  ⚡ Level {profile.user.level}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-verse-muted)' }}>
                  Joined {new Date(profile.user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
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
            <p className="text-xs mt-2" style={{ color: 'var(--color-verse-muted)' }}>
              Total XP: {profile.user.xp.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              className="glass-card p-5 text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mb-8"
        >
          <h3 className="font-bold text-lg mb-4">📊 Performance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)' }}>
              <p className="text-sm" style={{ color: 'var(--color-verse-muted)' }}>Days Active</p>
              <p className="text-xl font-bold">{profile.stats.daysSinceJoin}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)' }}>
              <p className="text-sm" style={{ color: 'var(--color-verse-muted)' }}>Quests/Day</p>
              <p className="text-xl font-bold">{profile.stats.questsPerDay}</p>
            </div>
          </div>
        </motion.div>

        {/* Top Skills */}
        {profile.topSkills?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 mb-8"
          >
            <h3 className="font-bold text-lg mb-4">🏆 Top Skills</h3>
            <div className="space-y-3">
              {profile.topSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-lg w-8 text-center">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{skill.name}</span>
                      <span className="text-xs" style={{ color: skill.color || 'var(--color-spider-red)' }}>
                        {skill.xp} XP • {skill.quest_count} quests
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--color-verse-surface)' }}>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-bold text-lg mb-4">🎖️ Achievements ({profile.achievements.length})</h3>
          {profile.achievements.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-4xl mb-3">🕸️</p>
              <p style={{ color: 'var(--color-verse-muted)' }}>Complete quests to unlock achievements</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.achievements.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="glass-card p-4 text-center"
                >
                  <div className="text-3xl mb-2">{ach.icon}</div>
                  <p className="font-bold text-sm">{ach.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{ach.description}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-verse-muted)' }}>
                    {new Date(ach.unlocked_at).toLocaleDateString()}
                  </p>
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
            className="glass-card p-6 mt-8"
            style={{ borderLeft: '3px solid var(--color-spider-gold)', background: 'rgba(255,215,0,0.05)' }}
          >
            <h3 className="font-bold" style={{ color: 'var(--color-spider-gold)' }}>{profile.activeEvent.title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>{profile.activeEvent.description}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-spider-gold)' }}>
              XP Modifier: {profile.activeEvent.xp_modifier}x
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
