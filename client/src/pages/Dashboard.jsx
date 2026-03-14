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

function parseDetails(quest) {
  const parts = (quest.description || '').split('\n\n');
  const mainDesc = parts[0] || quest.description;
  let details = null;
  for (let i = 1; i < parts.length; i++) {
    try { details = JSON.parse(parts[i]); break; } catch(e) { /* not JSON */ }
  }
  if (!details && quest.details) {
    try {
      details = typeof quest.details === 'string' ? JSON.parse(quest.details) : quest.details;
    } catch {
      details = null;
    }
  }
  return { mainDesc, details };
}

function QuestDetailModal({ quest, onClose, onComplete, completing }) {
  const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
  const { mainDesc, details } = parseDetails(quest);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-start justify-center overflow-y-auto sm:py-8 px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-2xl sm:my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="glass-card overflow-hidden sm:rounded-2xl"
          style={{ border: `1px solid ${style.color}40` }}>
          
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-verse-border)' }} />
          </div>

          <div className="relative p-4 sm:p-6 pb-3 sm:pb-4"
            style={{ background: `linear-gradient(135deg, ${style.color}20, ${style.color}05)` }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl">{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest block" style={{ color: style.color }}>
                    {style.label}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                    via {quest.source}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
                    style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                    +{quest.xp_reward} XP
                  </span>
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">
                {quest.title.replace(/^[^\:]+:\s*/, '')}
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-96 overflow-y-auto">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: style.color }}>
                🎯 Mission Brief
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                {mainDesc}
              </p>
            </div>

            {details?.steps && details.steps.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: style.color }}>
                  📋 Quest Steps
                </h3>
                <div className="space-y-2">
                  {details.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg"
                      style={{ background: 'var(--color-verse-surface)' }}>
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: `${style.color}30`, color: style.color }}>
                        {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-text)' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details?.fullDescription && (
              <div className="p-3 sm:p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)', border: '1px solid var(--color-verse-border)' }}>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                  📖 About This Topic
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                  {details.fullDescription.substring(0, 500)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--color-verse-border)' }}>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all"
              style={{ background: 'var(--color-verse-surface)', color: 'var(--color-verse-muted)' }}>
              Close
            </button>
            {!quest.completed && (
              <button
                onClick={() => onComplete(quest.id)}
                disabled={completing === quest.id}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${style.color}, ${style.color}cc)`,
                  color: 'white',
                }}>
                {completing === quest.id ? 'Completing...' : '✅ Complete Mission'}
              </button>
            )}
            {quest.completed && (
              <button
                disabled
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                ✅ Completed
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [profile, setProfile] = useState(null);
  const [randomEvent, setRandomEvent] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [xpAnimation, setXpAnimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="page-container flex items-center justify-center">
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
    <div className="page-container">
      {/* XP Gain Animation */}
      <AnimatePresence>
        {xpAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 text-center"
          >
            <div className="glass-card px-6 py-3 sm:px-8 sm:py-4" style={{ border: '1px solid var(--color-spider-gold)' }}>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-spider-gold)' }}>
                +{xpAnimation.xp} XP
              </p>
              {xpAnimation.leveledUp && (
                <p className="text-base sm:text-lg mt-1" style={{ color: 'var(--color-spider-red-light)' }}>
                  🎉 LEVEL UP!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto mobile-safe">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
            Hey, <span style={{ color: 'var(--color-spider-red-light)' }}>{user?.username || 'Spider'}</span> 🕷️
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' • '}
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </motion.div>

        {/* Stats Cards — 2x2 grid on mobile */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-5 sm:mb-8">
          {[
            { icon: '⚡', label: 'Level', value: user?.level || 1, color: 'var(--color-spider-gold)' },
            { icon: '🔥', label: 'Streak', value: `${user?.streak || 0}d`, color: 'var(--color-spider-red-light)' },
            { icon: '✅', label: 'Today', value: `${completedToday}/${totalToday}`, color: '#10B981' },
            { icon: '🧠', label: 'Skills', value: profile?.stats?.totalSkills || 0, color: 'var(--color-spider-purple)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-3 sm:p-5"
            >
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{stat.icon}</div>
              <p className="text-[10px] sm:text-sm font-medium" style={{ color: 'var(--color-verse-muted)' }}>{stat.label}</p>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* XP Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="glass-card p-4 sm:p-5 mb-5 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="font-semibold text-xs sm:text-sm">Level {user?.level || 1} Progress</span>
            <span className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
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

        {/* Random Event */}
        {randomEvent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 sm:p-5 mb-5 sm:mb-8"
            style={{ borderLeft: '3px solid var(--color-spider-gold)', background: 'rgba(255,215,0,0.05)' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl shrink-0">{randomEvent.title?.split(' ')[0] || '⚡'}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-spider-gold)' }}>
                  {randomEvent.title}
                </h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>
                  {randomEvent.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Quests */}
        <div className="mb-5 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <span>📋</span> Today's Missions
          </h2>
          <div className="grid gap-3 sm:gap-4">
            {quests.map((quest, i) => {
              const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={`glass-card p-4 sm:p-5 quest-${quest.type} cursor-pointer hover:opacity-80 transition-opacity`}
                  style={{ opacity: quest.completed ? 0.6 : 1 }}
                  onClick={() => setSelectedQuest(quest)}
                >
                  {/* Mobile: stack vertically. Desktop: side by side */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-lg sm:text-xl">{style.icon}</span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                          {quest.source}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-lg mb-1 leading-tight"
                        style={{ color: quest.completed ? 'var(--color-verse-muted)' : 'var(--color-verse-text)' }}>
                        {quest.title.replace(/^[^\:]+:\s*/, '')}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed truncate-2" style={{ color: 'var(--color-verse-muted)' }}>
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--color-spider-gold)' }}>
                          +{quest.xp_reward} XP
                        </span>
                        <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                          📂 {quest.domain}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">
                      {quest.completed ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          ✅
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(quest.id);
                          }}
                          disabled={completing === quest.id}
                          className="spider-btn text-xs sm:text-sm px-4 py-2.5 sm:px-4 sm:py-3 rounded-xl"
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
              <span>🏆</span> Recent Achievements
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.achievements.slice(0, 4).map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="glass-card p-3 sm:p-4 text-center"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{ach.icon}</div>
                  <p className="font-semibold text-xs sm:text-sm">{ach.name}</p>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>{ach.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-8">
          <Link to="/skills">
            <motion.div whileTap={{ scale: 0.97 }} className="glass-card p-4 sm:p-5 text-center cursor-pointer">
              <span className="text-2xl sm:text-3xl">🧠</span>
              <p className="font-semibold text-sm mt-2">Skill Map</p>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>Knowledge graph</p>
            </motion.div>
          </Link>
          <Link to="/profile">
            <motion.div whileTap={{ scale: 0.97 }} className="glass-card p-4 sm:p-5 text-center cursor-pointer">
              <span className="text-2xl sm:text-3xl">📊</span>
              <p className="font-semibold text-sm mt-2">Full Profile</p>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>All your stats</p>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailModal 
            quest={selectedQuest} 
            onClose={() => setSelectedQuest(null)}
            onComplete={handleComplete}
            completing={completing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
