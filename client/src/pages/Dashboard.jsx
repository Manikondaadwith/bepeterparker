import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import { Zap, Flame, CheckCircle2, Brain, Target, Compass, Palette, Dumbbell, Loader2, Trophy, ChevronRight, Sparkles, Clock } from 'lucide-react';

const QUEST_STYLES = {
  spider: { icon: Target, color: '#DC143C', label: 'Spider Mission', bg: 'rgba(220,20,60,0.1)' },
  side: { icon: Target, color: '#3B82F6', label: 'Side Mission', bg: 'rgba(59,130,246,0.1)' },
  exploration: { icon: Compass, color: '#FFD700', label: 'Exploration', bg: 'rgba(255,215,0,0.1)' },
  creativity: { icon: Palette, color: '#7C3AED', label: 'Creativity', bg: 'rgba(124,58,237,0.1)' },
  physical: { icon: Dumbbell, color: '#10B981', label: 'Physical', bg: 'rgba(16,185,129,0.1)' },
  chaos: { icon: Sparkles, color: '#00F5FF', label: 'Chaos Quest', bg: 'rgba(0,245,255,0.1)' },
};

function parseDetails(quest) {
  const parts = (quest.description || '').split('\n\n');
  const mainDesc = parts[0] || quest.description;
  let details = null;
  for (let i = 1; i < parts.length; i++) {
    try { details = JSON.parse(parts[i]); break; } catch { /* not JSON */ }
  }
  if (!details && quest.details) {
    try {
      details = typeof quest.details === 'string' ? JSON.parse(quest.details) : quest.details;
    } catch { details = null; }
  }
  return { mainDesc, details };
}

// Skeleton loader for stat cards
function StatSkeleton() {
  return (
    <div className="glass-card p-3 sm:p-5 animate-pulse">
      <div className="w-6 h-6 rounded bg-white/5 mb-2" />
      <div className="w-12 h-3 rounded bg-white/5 mb-2" />
      <div className="w-16 h-5 rounded bg-white/5" />
    </div>
  );
}

function QuestDetailModal({ quest, onClose, onComplete, completing }) {
  const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
  const { mainDesc, details } = parseDetails(quest);
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto sm:py-8 px-0 sm:px-4"
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${style.color}20` }}>
                  <Icon size={18} style={{ color: style.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest block" style={{ color: style.color }}>
                    {style.label.toUpperCase()}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                    via {quest.source}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  +{quest.xp_reward} XP
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">
                {quest.title.replace(/^[^\:]+:\s*/, '')}
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-96 overflow-y-auto">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: style.color }}>
                <Target size={12} /> Mission Brief
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                {mainDesc}
              </p>
            </div>

            {details?.steps && details.steps.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: style.color }}>
                  Quest Steps
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

            {details?.whyItMatters && (
              <div className="p-3 sm:p-4 rounded-xl" style={{ background: `${style.color}08`, border: `1px solid ${style.color}20` }}>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: style.color }}>
                  <Brain size={12} /> Why It Matters
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed italic" style={{ color: 'var(--color-verse-text)' }}>
                  {details.whyItMatters}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--color-verse-border)' }}>
            <button onClick={onClose} className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all"
              style={{ background: 'var(--color-verse-surface)', color: 'var(--color-verse-muted)' }}>
              Close
            </button>
            {!quest.completed ? (
              <button onClick={() => onComplete(quest.id)} disabled={completing === quest.id}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${style.color}, ${style.color}cc)`, color: 'white', boxShadow: `0 4px 15px ${style.color}40` }}>
                {completing === quest.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {completing === quest.id ? 'Completing...' : 'Complete'}
              </button>
            ) : (
              <button disabled className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                <CheckCircle2 size={16} /> Completed
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
    const timer = setInterval(() => setTime(new Date()), 60000); // Update every minute, not second
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [questData, profileData] = await Promise.all([
          api.getDailyQuests(),
          api.getProfile()
        ]);
        if (cancelled) return;
        setQuests(questData.quests || []);
        setRandomEvent(questData.randomEvent || profileData.activeEvent);
        setProfile(profileData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleComplete = useCallback(async (questId) => {
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
  }, [completing, updateUser]);

  const xpProgress = useMemo(() => profile?.xpProgress || { currentXp: 0, requiredXp: 100, percentage: 0 }, [profile]);
  const completedToday = useMemo(() => quests.filter(q => q.completed).length, [quests]);
  const totalToday = quests.length;
  const streakMultiplier = useMemo(() => Math.min(1.5, 1 + (user?.streak || 0) * 0.05), [user?.streak]);
  const allQuestsComplete = totalToday > 0 && completedToday === totalToday;

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-6xl mx-auto mobile-safe">
          <div className="mb-6">
            <div className="w-48 h-8 rounded bg-white/5 animate-pulse mb-2" />
            <div className="w-32 h-4 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <div className="glass-card p-4 mb-6 animate-pulse">
            <div className="w-full h-4 rounded bg-white/5" />
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="glass-card p-4 mb-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-white/5 rounded" />
                  <div className="w-1/2 h-3 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* XP Gain Animation */}
      <AnimatePresence>
        {xpAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 text-center xp-burst"
          >
            <div className="glass-card px-6 py-3 sm:px-8 sm:py-4" style={{ border: '1px solid var(--color-spider-gold)', boxShadow: '0 0 40px rgba(255,215,0,0.2)' }}>
              <p className="text-2xl sm:text-3xl font-bold gradient-text-gold flex items-center gap-2 justify-center">
                <Zap size={24} /> +{xpAnimation.xp} XP
              </p>
              {xpAnimation.leveledUp && (
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: 3 }}
                  className="text-base sm:text-lg mt-1 gradient-text-red font-bold">
                  LEVEL UP!
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto mobile-safe">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
            Hey, <span className="gradient-text-red">{user?.username || 'Spider'}</span>
          </h1>
          <p className="text-xs sm:text-sm flex items-center gap-1.5" style={{ color: 'var(--color-verse-muted)' }}>
            <Clock size={12} />
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-5 sm:mb-8">
          {[
            { icon: Zap, label: 'Level', value: user?.level || 1, color: 'var(--color-spider-gold)', glowClass: 'stat-glow-level' },
            { icon: Flame, label: 'Streak', value: `${user?.streak || 0}d`, color: 'var(--color-spider-red-light)', glowClass: 'stat-glow-streak', extra: streakMultiplier > 1 ? `${Math.floor((streakMultiplier - 1) * 100)}% bonus` : null },
            { icon: CheckCircle2, label: 'Today', value: `${completedToday}/${totalToday}`, color: '#10B981', glowClass: 'stat-glow-today' },
            { icon: Brain, label: 'Skills', value: profile?.stats?.totalSkills || 0, color: 'var(--color-spider-purple)', glowClass: 'stat-glow-skills' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass-card hover-tilt p-3 sm:p-5 ${stat.glowClass}`}>
                <Icon size={22} className="mb-1 sm:mb-2" style={{ color: stat.color }} />
                <p className="text-[10px] sm:text-sm font-medium" style={{ color: 'var(--color-verse-muted)' }}>{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                {stat.extra && (
                  <p className="text-[9px] sm:text-xs mt-0.5 font-medium streak-fire flex items-center gap-1" style={{ color: 'var(--color-boss-orange)' }}>
                    <Flame size={10} /> {stat.extra}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Streak Multiplier */}
        {streakMultiplier > 1 && (
          <motion.div initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }}
            className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3"
            style={{ borderLeft: '3px solid var(--color-boss-orange)', background: 'rgba(255,107,53,0.05)' }}>
            <Flame size={22} className="streak-fire shrink-0" style={{ color: 'var(--color-boss-orange)' }} />
            <div>
              <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--color-boss-orange)' }}>
                Streak Multiplier Active: {streakMultiplier.toFixed(2)}x XP
              </p>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                Keep your streak going for bigger rewards!
              </p>
            </div>
          </motion.div>
        )}

        {/* XP Bar */}
        <motion.div initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} className="glass-card p-4 sm:p-5 mb-5 sm:mb-8">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
              <Zap size={14} style={{ color: 'var(--color-spider-gold)' }} /> Level {user?.level || 1} Progress
            </span>
            <span className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-muted)' }}>
              {Math.floor(xpProgress.currentXp)} / {xpProgress.requiredXp} XP
            </span>
          </div>
          <div className="xp-bar-container">
            <motion.div className="xp-bar-fill" initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percentage}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
          </div>
        </motion.div>

        {/* Random Event */}
        {randomEvent && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 sm:p-5 mb-5 sm:mb-8 glass-card-glow"
            style={{ borderLeft: '3px solid var(--color-spider-gold)', background: 'rgba(255,215,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <Sparkles size={24} className="shrink-0" style={{ color: 'var(--color-spider-gold)' }} />
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base gradient-text-gold">{randomEvent.title}</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-verse-muted)' }}>{randomEvent.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Boss Battle Banner */}
        {allQuestsComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4 sm:p-6 mb-5 sm:mb-8 text-center"
            style={{ border: '1px solid rgba(255,107,53,0.4)', animation: 'boss-pulse 3s ease-in-out infinite' }}>
            <Trophy size={36} className="mx-auto mb-2" style={{ color: 'var(--color-boss-orange)' }} />
            <h3 className="text-lg sm:text-xl font-extrabold mb-1" style={{ color: 'var(--color-boss-orange)' }}>BOSS BATTLE UNLOCKED!</h3>
            <p className="text-xs sm:text-sm mb-3" style={{ color: 'var(--color-verse-muted)' }}>All daily missions complete. Face the final challenge!</p>
            <Link to="/quests">
              <motion.button whileTap={{ scale: 0.95 }} className="boss-btn text-sm sm:text-base">Enter Boss Battle</motion.button>
            </Link>
          </motion.div>
        )}

        {/* Daily Quests */}
        <div className="mb-5 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <Target size={20} style={{ color: 'var(--color-spider-red)' }} />
            Today's Missions
            <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ml-auto"
              style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
              {completedToday}/{totalToday}
            </span>
          </h2>
          <div className="grid gap-3 sm:gap-4">
            {quests.map((quest, i) => {
              const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
              const Icon = style.icon;
              return (
                <motion.div key={quest.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                  className={`glass-card hover-tilt p-4 sm:p-5 quest-${quest.type} cursor-pointer transition-opacity`}
                  style={{ opacity: quest.completed ? 0.6 : 1 }}
                  onClick={() => setSelectedQuest(quest)}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: style.bg }}>
                          <Icon size={14} style={{ color: style.color }} />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                          style={{ color: style.color }}>
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
                        {quest.description.split('\n\n')[0]}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--color-spider-gold)' }}>
                          <Zap size={10} /> +{quest.xp_reward} XP
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">
                      {quest.completed ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <CheckCircle2 size={20} style={{ color: '#34D399' }} />
                        </div>
                      ) : (
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); handleComplete(quest.id); }}
                          disabled={completing === quest.id}
                          className="spider-btn text-xs sm:text-sm px-4 py-2.5 sm:px-4 sm:py-3 rounded-xl flex items-center gap-1.5">
                          {completing === quest.id ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
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
              <Trophy size={20} style={{ color: 'var(--color-spider-gold)' }} /> Recent Achievements
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.achievements.slice(0, 4).map((ach, i) => (
                <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}
                  className="glass-card hover-tilt p-3 sm:p-4 text-center">
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
            <motion.div whileTap={{ scale: 0.97 }} className="glass-card hover-tilt p-4 sm:p-5 text-center cursor-pointer">
              <Brain size={28} className="mx-auto mb-2" style={{ color: 'var(--color-spider-purple)' }} />
              <p className="font-semibold text-sm">Skill Map</p>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>Knowledge graph</p>
            </motion.div>
          </Link>
          <Link to="/profile">
            <motion.div whileTap={{ scale: 0.97 }} className="glass-card hover-tilt p-4 sm:p-5 text-center cursor-pointer">
              <Zap size={28} className="mx-auto mb-2" style={{ color: 'var(--color-spider-gold)' }} />
              <p className="font-semibold text-sm">Full Profile</p>
              <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--color-verse-muted)' }}>All your stats</p>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleComplete} completing={completing} />
        )}
      </AnimatePresence>
    </div>
  );
}
