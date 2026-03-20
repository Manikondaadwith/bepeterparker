import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Target, Compass, Palette, Dumbbell, Sparkles, Brain, CheckCircle2, Zap, Flame, Loader2, Swords, Clock, ChevronRight, X, FileText, Lightbulb, ExternalLink, History, ListChecks } from 'lucide-react';

const QUEST_STYLES = {
  spider: { icon: Target, color: '#DC143C', gradient: 'linear-gradient(135deg, rgba(220,20,60,0.15), rgba(139,0,0,0.1))', label: 'SPIDER MISSION', accent: '#FF4466' },
  side: { icon: Target, color: '#3B82F6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(30,58,138,0.1))', label: 'SIDE MISSION', accent: '#60A5FA' },
  exploration: { icon: Compass, color: '#FFD700', gradient: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(180,150,0,0.1))', label: 'EXPLORATION', accent: '#FBBF24' },
  creativity: { icon: Palette, color: '#7C3AED', gradient: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(88,28,135,0.1))', label: 'CREATIVITY', accent: '#A78BFA' },
  physical: { icon: Dumbbell, color: '#10B981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,95,70,0.1))', label: 'PHYSICAL', accent: '#34D399' },
  chaos: { icon: Sparkles, color: '#00F5FF', gradient: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(0,100,120,0.1))', label: 'CHAOS QUEST', accent: '#00F5FF' },
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

          <div className="relative p-4 sm:p-6 pb-3 sm:pb-4" style={{ background: style.gradient }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${style.color}20` }}>
                  <Icon size={22} style={{ color: style.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest block" style={{ color: style.accent }}>
                    {style.label}
                  </span>
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                    via {quest.source}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {details?.difficulty && (
                    <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full" style={{
                      background: details.difficulty === 'Hard' ? 'rgba(220,20,60,0.2)' :
                                  details.difficulty === 'Medium' ? 'rgba(255,215,0,0.2)' : 'rgba(16,185,129,0.2)',
                      color: details.difficulty === 'Hard' ? '#FF4466' :
                             details.difficulty === 'Medium' ? '#FBBF24' : '#34D399',
                    }}>
                      {details.difficulty}
                    </span>
                  )}
                  {details?.timeEstimate && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full hidden xs:inline-flex items-center gap-1"
                      style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                      <Clock size={10} /> {details.timeEstimate}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">
                {quest.title.replace(/^[^\:]+:\s*/, '')}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  <Zap size={12} /> +{quest.xp_reward} XP
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                  <FileText size={10} /> {quest.domain}
                </span>
                {quest.completed && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                    <CheckCircle2 size={10} /> Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-96 overflow-y-auto">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: style.accent }}>
                <Target size={12} /> Mission Brief
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                {mainDesc}
              </p>
            </div>

            {details?.fullDescription && (
              <div className="p-3 sm:p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)', border: '1px solid var(--color-verse-border)' }}>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-verse-muted)' }}>
                  <FileText size={12} /> About This Topic
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                  {details.fullDescription.substring(0, 400)}
                </p>
              </div>
            )}

            {details?.steps && details.steps.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5" style={{ color: style.accent }}>
                  <ListChecks size={12} /> Quest Steps
                </h3>
                <div className="space-y-2">
                  {details.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg"
                      style={{ background: 'var(--color-verse-surface)' }}>
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: `${style.color}30`, color: style.accent }}>
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
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: style.accent }}>
                  <Brain size={12} /> Why It Matters
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed italic" style={{ color: 'var(--color-verse-text)' }}>
                  {details.whyItMatters}
                </p>
              </div>
            )}

            {details?.tips && details.tips.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-verse-muted)' }}>
                  <Lightbulb size={12} /> Pro Tips
                </h3>
                <ul className="space-y-1">
                  {details.tips.map((tip, i) => (
                    <li key={i} className="text-xs sm:text-sm flex items-start gap-2" style={{ color: 'var(--color-verse-muted)' }}>
                      <span style={{ color: 'var(--color-spider-gold)' }}>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {details?.sourceUrl && (
              <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg transition-all"
                style={{ background: 'var(--color-verse-surface)', color: style.accent, border: '1px solid var(--color-verse-border)' }}>
                <ExternalLink size={14} /> Read More
                <span className="ml-auto text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>↗</span>
              </a>
            )}
          </div>

          <div className="p-4 sm:p-6 pt-0 flex items-center gap-2 sm:gap-3">
            {!quest.completed ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onComplete(quest)}
                disabled={completing}
                className="spider-btn flex-1 text-center py-3 sm:py-4 text-sm sm:text-lg font-bold flex items-center justify-center gap-2"
              >
                {completing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {completing ? 'Processing...' : `Complete (+${quest.xp_reward} XP)`}
              </motion.button>
            ) : (
              <div className="flex-1 text-center py-3 sm:py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={16} /> Quest Completed
              </div>
            )}
            <button onClick={onClose}
              className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium transition-all text-sm"
              style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)', border: '1px solid var(--color-verse-border)' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== Boss Battle Modal =====
function BossBattleModal({ battle, onClose, onComplete, completing }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: 30 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="glass-card p-6 sm:p-8 w-full max-w-lg"
        style={{ border: '1px solid rgba(255,107,53,0.4)', animation: 'boss-pulse 3s ease-in-out infinite' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <motion.div 
            animate={{ scale: [1, 1.15, 1] }} 
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-3 mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(220,20,60,0.2))' }}
          >
            <Swords size={32} style={{ color: 'var(--color-boss-orange)' }} />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2" style={{ color: 'var(--color-boss-orange)' }}>
            {battle.title || 'Boss Battle'}
          </h2>
          <p className="text-xs sm:text-sm italic" style={{ color: 'var(--color-verse-muted)' }}>
            {battle.narrative}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl mb-4" style={{ background: 'var(--color-verse-surface)', border: '1px solid var(--color-verse-border)' }}>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-boss-orange)' }}>
            <Swords size={12} /> Challenge
          </p>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
            {battle.description}
          </p>
        </div>

        {battle.steps && (
          <div className="space-y-2 mb-4">
            {battle.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,107,53,0.05)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(255,107,53,0.2)', color: 'var(--color-boss-orange)' }}>
                  {i + 1}
                </span>
                <span className="text-xs sm:text-sm" style={{ color: 'var(--color-verse-text)' }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onComplete(battle.bonusXP)}
            disabled={completing}
            className="boss-btn flex-1 text-sm sm:text-base py-3 flex items-center justify-center gap-2"
          >
            {completing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {completing ? 'Fighting...' : `Defeat Boss (+${battle.bonusXP} XP)`}
          </motion.button>
          <button onClick={onClose}
            className="px-4 py-3 rounded-xl font-medium text-sm"
            style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)', border: '1px solid var(--color-verse-border)' }}>
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== Chaos Quest Card =====
function ChaosQuestCard({ quest, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateZ: -2 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card p-4 sm:p-5 quest-chaos mb-4"
    >
      <div className="flex items-start gap-3">
        <motion.div 
          animate={{ rotate: [0, 360] }} 
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,245,255,0.1)' }}
        >
          <Sparkles size={20} style={{ color: '#00F5FF' }} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest gradient-text-chaos">CHAOS QUEST</span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(0,245,255,0.1)', color: '#00F5FF' }}>
              <Zap size={8} /> +{quest.xpReward || quest.xp_reward} XP
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-lg leading-tight mb-1">{quest.title}</h3>
          <p className="text-xs sm:text-sm italic mb-2" style={{ color: 'var(--color-verse-muted)' }}>
            {quest.narrative || quest.description}
          </p>
          {quest.steps && (
            <div className="space-y-1 mb-2">
              {quest.steps.map((step, i) => (
                <p key={i} className="text-[11px] sm:text-xs flex gap-2" style={{ color: 'var(--color-verse-muted)' }}>
                  <span style={{ color: '#00F5FF' }}>{i + 1}.</span> {step}
                </p>
              ))}
            </div>
          )}
          <button onClick={onDismiss}
            className="text-[10px] sm:text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1"
            style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)', border: '1px solid var(--color-verse-border)' }}>
            <X size={10} /> Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function QuestPage() {
  const { updateUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // New features
  const [chaosQuest, setChaosQuest] = useState(null);
  const [loadingChaos, setLoadingChaos] = useState(false);
  const [bossBattle, setBossBattle] = useState(null);
  const [loadingBoss, setLoadingBoss] = useState(false);
  const [completingBoss, setCompletingBoss] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getDailyQuests();
        if (cancelled) return;
        setQuests(data.quests || []);
        const done = (data.quests || []).every(q => q.completed);
        setAllComplete(done && (data.quests || []).length >= 6);
      } catch (err) {
        console.error('Quest load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getQuestHistory();
      setHistory(data.quests || []);
      setShowHistory(true);
    } catch (err) {
      console.error('History load error:', err);
    }
  }, []);

  const handleComplete = useCallback(async (quest) => {
    if (completing) return;
    setCompleting(true);
    try {
      const result = await api.completeQuest(quest.id);
      setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: 1 } : q));
      setCompletionResult(result);
      updateUser(result.user);
      if (selectedQuest?.id === quest.id) setSelectedQuest({ ...quest, completed: 1 });
      if (result.allQuestsComplete) setAllComplete(true);
      setTimeout(() => setCompletionResult(null), 5000);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(false);
    }
  }, [completing, selectedQuest, updateUser]);

  const handleChaosMode = useCallback(async () => {
    setLoadingChaos(true);
    try {
      const data = await api.getChaosQuest();
      setChaosQuest(data.quest);
    } catch (err) {
      console.error('Chaos quest error:', err);
    } finally {
      setLoadingChaos(false);
    }
  }, []);

  const handleBossBattle = useCallback(async () => {
    setLoadingBoss(true);
    try {
      const data = await api.getBossBattle();
      setBossBattle(data.bossBattle);
    } catch (err) {
      console.error('Boss battle error:', err);
    } finally {
      setLoadingBoss(false);
    }
  }, []);

  const handleCompleteBoss = useCallback(async (bonusXP) => {
    setCompletingBoss(true);
    try {
      const result = await api.completeBossBattle(bonusXP);
      updateUser(result.user);
      setBossBattle(null);
      setCompletionResult({ xpResult: result.xpResult, bossBonus: { message: 'BOSS DEFEATED!', xp: result.xpResult.xpGained } });
      setTimeout(() => setCompletionResult(null), 5000);
    } catch (err) {
      console.error('Boss complete error:', err);
    } finally {
      setCompletingBoss(false);
    }
  }, [updateUser]);

  const completedCount = useMemo(() => quests.filter(q => q.completed).length, [quests]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto mobile-safe">
          <div className="w-48 h-8 rounded bg-white/5 animate-pulse mb-6" />
          <div className="glass-card p-4 mb-4 animate-pulse"><div className="w-full h-3 rounded bg-white/5" /></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card p-5 mb-3 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="w-20 h-3 bg-white/5 rounded" />
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
      {/* Completion Overlay */}
      <AnimatePresence>
        {completionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setCompletionResult(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="glass-card p-6 sm:p-10 text-center w-full max-w-sm xp-burst"
              style={{ border: '1px solid var(--color-spider-gold)', boxShadow: '0 0 50px rgba(255,215,0,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: 3 }} className="mb-3 sm:mb-4 flex justify-center">
                <Zap size={48} style={{ color: 'var(--color-spider-gold)' }} />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 gradient-text-gold">
                +{completionResult.xpResult?.xpGained || 0} XP
              </h2>
              {completionResult.xpResult?.streakBonus > 0 && (
                <p className="text-xs sm:text-sm mb-1 flex items-center justify-center gap-1" style={{ color: 'var(--color-spider-red-light)' }}>
                  <Flame size={14} /> Streak Bonus: +{completionResult.xpResult.streakBonus} XP
                </p>
              )}
              {completionResult.xpResult?.leveledUp && (
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="text-xl sm:text-2xl font-bold mt-3 gradient-text-red">
                  LEVEL UP! Level {completionResult.xpResult.newLevel}
                </motion.p>
              )}
              {completionResult.bossBonus && (
                <div className="mt-3 sm:mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,107,53,0.15)' }}>
                  <p className="font-bold text-sm flex items-center justify-center gap-1" style={{ color: 'var(--color-boss-orange)' }}>
                    <Swords size={14} /> {completionResult.bossBonus.message}
                  </p>
                  <p className="text-xs gradient-text-gold">+{completionResult.bossBonus.xp} bonus XP</p>
                </div>
              )}
              <button onClick={() => setCompletionResult(null)} className="spider-btn mt-4 sm:mt-6 text-sm">Continue</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boss Battle Modal */}
      <AnimatePresence>
        {bossBattle && (
          <BossBattleModal battle={bossBattle} onClose={() => setBossBattle(null)} onComplete={handleCompleteBoss} completing={completingBoss} />
        )}
      </AnimatePresence>

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleComplete} completing={completing} />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto mobile-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8 gap-3">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <Swords size={28} style={{ color: 'var(--color-spider-red)' }} /> Quest Board
          </motion.h1>
          <div className="flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={showHistory ? () => setShowHistory(false) : loadHistory}
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)', color: 'var(--color-verse-muted)' }}
            >
              {showHistory ? <><ListChecks size={14} /> Today</> : <><History size={14} /> History</>}
            </motion.button>
          </div>
        </div>

        {/* Action Buttons: Chaos Mode + Boss Battle */}
        {!showHistory && (
          <div className="flex gap-3 mb-4 sm:mb-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleChaosMode}
              disabled={loadingChaos}
              className="chaos-btn flex-1 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {loadingChaos ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Chaos Mode
            </motion.button>
            
            {allComplete && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBossBattle}
                disabled={loadingBoss}
                className="boss-btn flex-1 text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {loadingBoss ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
                Boss Battle
              </motion.button>
            )}
          </div>
        )}

        {/* Chaos Quest Card */}
        <AnimatePresence>
          {chaosQuest && !showHistory && (
            <ChaosQuestCard quest={chaosQuest} onDismiss={() => setChaosQuest(null)} />
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        {!showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-verse-muted)' }}>
                Daily Progress
              </span>
              <span className="text-xs sm:text-sm font-bold" style={{ color: completedCount === quests.length && quests.length > 0 ? '#34D399' : 'var(--color-spider-gold)' }}>
                {completedCount}/{quests.length}
              </span>
            </div>
            <div className="xp-bar-container" style={{ height: '8px' }}>
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={completedCount === quests.length && quests.length > 0 ? { background: 'linear-gradient(90deg, #10B981, #34D399)' } : {}}
              />
            </div>
          </motion.div>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-1.5" style={{ color: 'var(--color-verse-muted)' }}>
          <Lightbulb size={12} /> Tap any quest to see full details and steps.
        </motion.p>

        {/* Quest List */}
        <div className="space-y-3 sm:space-y-4">
          {(showHistory ? history : quests).map((quest, i) => {
            const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
            const { details } = parseDetails(quest);
            const Icon = style.icon;
            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="glass-card hover-tilt overflow-hidden cursor-pointer group"
                style={{ opacity: quest.completed ? 0.7 : 1 }}
                onClick={() => setSelectedQuest(quest)}
              >
                <div className="p-4 sm:p-5" style={{ background: style.gradient }}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${style.color}15`, border: `1px solid ${style.color}30` }}>
                      {quest.completed ? <CheckCircle2 size={22} style={{ color: '#34D399' }} /> : <Icon size={22} style={{ color: style.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest" style={{ color: style.accent }}>
                          {style.label}
                        </span>
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                          {quest.source}
                        </span>
                        {details?.difficulty && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline" style={{
                            background: details.difficulty === 'Hard' ? 'rgba(220,20,60,0.15)' :
                                        details.difficulty === 'Medium' ? 'rgba(255,215,0,0.15)' : 'rgba(16,185,129,0.15)',
                            color: details.difficulty === 'Hard' ? '#FF4466' :
                                   details.difficulty === 'Medium' ? '#FBBF24' : '#34D399',
                          }}>
                            {details.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm sm:text-lg leading-tight">{quest.title.replace(/^[^\:]+:\s*/, '')}</h3>
                      <p className="text-[11px] sm:text-sm mt-1 truncate-2 leading-relaxed" style={{ color: 'var(--color-verse-muted)' }}>
                        {quest.description.split('\n\n')[0]}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                        <span className="text-xs sm:text-sm font-semibold gradient-text-gold flex items-center gap-1">
                          <Zap size={12} /> +{quest.xp_reward} XP
                        </span>
                        <span className="text-[10px] sm:text-xs flex items-center gap-1" style={{ color: 'var(--color-verse-muted)' }}>
                          <FileText size={10} /> {quest.domain}
                        </span>
                      </div>
                    </div>
                    {!quest.completed && !showHistory && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                        disabled={completing}
                        className="spider-btn text-xs shrink-0 hidden sm:flex items-center gap-1.5"
                      >
                        <ChevronRight size={14} /> Complete
                      </motion.button>
                    )}
                  </div>
                  {!quest.completed && !showHistory && (
                    <div className="sm:hidden mt-3 pt-3" style={{ borderTop: `1px solid ${style.color}20` }}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                        disabled={completing}
                        className="spider-btn text-xs w-full text-center py-2.5 flex items-center justify-center gap-1.5"
                      >
                        <Zap size={12} /> Complete Quest
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {showHistory && history.length === 0 && (
          <div className="text-center py-16 sm:py-20" style={{ color: 'var(--color-verse-muted)' }}>
            <History size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">No quest history yet. Complete your first quest!</p>
          </div>
        )}
      </div>
    </div>
  );
}
