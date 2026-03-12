import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

const QUEST_STYLES = {
  spider: { icon: '🕷️', color: '#DC143C', label: 'Spider Mission', bg: 'rgba(220,20,60,0.1)' },
  side: { icon: '🎯', color: '#3B82F6', label: 'Side Mission', bg: 'rgba(59,130,246,0.1)' },
  exploration: { icon: '🔭', color: '#FFD700', label: 'Exploration', bg: 'rgba(255,215,0,0.1)' },
  creativity: { icon: '🎨', color: '#7C3AED', label: 'Creativity', bg: 'rgba(124,58,237,0.1)' },
  physical: { icon: '💪', color: '#10B981', label: 'Physical', bg: 'rgba(16,185,129,0.1)' },
};

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [randomEvent, setRandomEvent] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [xpAnimation, setXpAnimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [questData, profileData] = await Promise.all([
          api.getDailyQuests(),
          api.getProfile()
        ]);
        setQuests(questData.quests || []);
        setRandomEvent(questData.randomEvent || profileData.activeEvent);
        setProfile(profileData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleComplete = async (questId) => {
    if (completing) return;
    setCompleting(questId);
    try {
      const result = await api.completeQuest(questId);
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: 1 } : q));
      setXpAnimation({ xp: result.xpResult.xpGained, leveledUp: result.xpResult.leveledUp });
      updateUser(result.user);
      setProfile(prev => prev ? { ...prev, user: result.user, xpProgress: result.xpProgress } : prev);
      setTimeout(() => setXpAnimation(null), 3000);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: 'var(--color-verse-bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  const xpProgress = profile?.xpProgress || { currentXp: 0, requiredXp: 100, percentage: 0 };
  const completedToday = quests.filter(q => q.completed).length;
  const totalToday = quests.length;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4" style={{ background: 'var(--color-verse-bg)' }}>
      {/* XP Gain Animation */}
      <AnimatePresence>
        {xpAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 text-center"
          >
            <div className="glass-card px-8 py-4" style={{ border: '1px solid var(--color-spider-gold)' }}>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-spider-gold)' }}>
                +{xpAnimation.xp} XP
              </p>
              {xpAnimation.leveledUp && (
                <p className="text-lg mt-1" style={{ color: 'var(--color-spider-red-light)' }}>
                  🎉 LEVEL UP!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header Row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              Hey, <span style={{ color: 'var(--color-spider-red-light)' }}>{user?.username || 'Spider'}</span> 🕷️
            </h1>
            <p style={{ color: 'var(--color-verse-muted)' }}>
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' • '}
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '⚡', label: 'Level', value: user?.level || 1, color: 'var(--color-spider-gold)' },
            { icon: '🔥', label: 'Streak', value: `${user?.streak || 0} days`, color: 'var(--color-spider-red-light)' },
            { icon: '✅', label: 'Today', value: `${completedToday}/${totalToday}`, color: '#10B981' },
            { icon: '🧠', label: 'Skills', value: profile?.stats?.totalSkills || 0, color: 'var(--color-spider-purple)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-verse-muted)' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* XP Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="glass-card p-5 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Level {user?.level || 1} Progress</span>
            <span className="text-sm" style={{ color: 'var(--color-verse-muted)' }}>
              {Math.floor(xpProgress.currentXp)} / {xpProgress.requiredXp} XP
            </span>
          </div>
          <div className="xp-bar-container">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percentage}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Random Event Banner */}
        {randomEvent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-5 mb-8"
            style={{ borderLeft: '3px solid var(--color-spider-gold)', background: 'rgba(255,215,0,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{randomEvent.title?.split(' ')[0] || '⚡'}</span>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-spider-gold)' }}>
                  {randomEvent.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>
                  {randomEvent.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Quests */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Today's Missions
          </h2>
          <div className="grid gap-4">
            {quests.map((quest, i) => {
              const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`glass-card p-5 quest-${quest.type}`}
                  style={{ opacity: quest.completed ? 0.6 : 1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{style.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                          {quest.source}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: quest.completed ? 'var(--color-verse-muted)' : 'var(--color-verse-text)' }}>
                        {quest.title.replace(/^[^\:]+:\s*/, '')}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-verse-muted)' }}>
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--color-spider-gold)' }}>
                          +{quest.xp_reward} XP
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                          📂 {quest.domain}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {quest.completed ? (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          ✅
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleComplete(quest.id)}
                          disabled={completing === quest.id}
                          className="spider-btn text-sm px-4 py-3 rounded-xl"
                          style={{ minWidth: 100 }}
                        >
                          {completing === quest.id ? '...' : 'Complete'}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Achievements Preview */}
        {profile?.achievements?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🏆</span> Recent Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.achievements.slice(0, 4).map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass-card p-4 text-center"
                >
                  <div className="text-3xl mb-2">{ach.icon}</div>
                  <p className="font-semibold text-sm">{ach.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{ach.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link to="/skills">
            <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-5 text-center cursor-pointer">
              <span className="text-3xl">🧠</span>
              <p className="font-semibold mt-2">Skill Map</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>View your knowledge graph</p>
            </motion.div>
          </Link>
          <Link to="/profile">
            <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-5 text-center cursor-pointer">
              <span className="text-3xl">📊</span>
              <p className="font-semibold mt-2">Full Profile</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>See all your stats</p>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
