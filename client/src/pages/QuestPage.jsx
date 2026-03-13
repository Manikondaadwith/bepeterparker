import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const QUEST_STYLES = {
  spider: { icon: '🕷️', color: '#DC143C', gradient: 'linear-gradient(135deg, rgba(220,20,60,0.15), rgba(139,0,0,0.1))', label: 'SPIDER MISSION', accent: '#FF4466' },
  side: { icon: '🎯', color: '#3B82F6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(30,58,138,0.1))', label: 'SIDE MISSION', accent: '#60A5FA' },
  exploration: { icon: '🔭', color: '#FFD700', gradient: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(180,150,0,0.1))', label: 'EXPLORATION', accent: '#FBBF24' },
  creativity: { icon: '🎨', color: '#7C3AED', gradient: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(88,28,135,0.1))', label: 'CREATIVITY', accent: '#A78BFA' },
  physical: { icon: '💪', color: '#10B981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,95,70,0.1))', label: 'PHYSICAL', accent: '#34D399' },
};

function parseDetails(quest) {
  const parts = (quest.description || '').split('\n\n');
  const mainDesc = parts[0] || quest.description;
  let details = null;
  for (let i = 1; i < parts.length; i++) {
    try { details = JSON.parse(parts[i]); break; } catch(e) { /* not JSON */ }
  }
  if (!details && quest.details) {
    details = typeof quest.details === 'string' ? JSON.parse(quest.details) : quest.details;
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
          style={{
            border: `1px solid ${style.color}40`,
            borderRadius: window.innerWidth < 640 ? '20px 20px 0 0' : undefined,
            maxHeight: window.innerWidth < 640 ? '90dvh' : 'none',
            overflowY: 'auto',
          }}
        >
          {/* Drag handle on mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-verse-border)' }} />
          </div>

          {/* Header */}
          <div className="relative p-4 sm:p-6 pb-3 sm:pb-4" style={{ background: style.gradient }}>
            {details?.thumbnail && (
              <div className="absolute inset-0 opacity-20">
                <img src={details.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl">{style.icon}</span>
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
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full hidden xs:inline"
                      style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                      ⏱ {details.timeEstimate}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">
                {quest.title.replace(/^[^\:]+:\s*/, '')}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  +{quest.xp_reward} XP
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                  📂 {quest.domain}
                </span>
                {quest.completed && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                    ✅ Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: style.accent }}>
                🎯 Mission Brief
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                {mainDesc}
              </p>
            </div>

            {details?.fullDescription && (
              <div className="p-3 sm:p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)', border: '1px solid var(--color-verse-border)' }}>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                  📖 About This Topic
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                  {details.fullDescription.substring(0, 400)}
                </p>
              </div>
            )}

            {details?.steps && details.steps.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: style.accent }}>
                  📋 Quest Steps
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
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: style.accent }}>
                  🧠 Why It Matters
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed italic" style={{ color: 'var(--color-verse-text)' }}>
                  {details.whyItMatters}
                </p>
              </div>
            )}

            {details?.tips && details.tips.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 sm:mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                  💡 Pro Tips
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
                🔗 Read More
                <span className="ml-auto text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>↗</span>
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 pt-0 flex items-center gap-2 sm:gap-3">
            {!quest.completed ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onComplete(quest)}
                disabled={completing}
                className="spider-btn flex-1 text-center py-3 sm:py-4 text-sm sm:text-lg font-bold"
              >
                {completing ? '⏳ Processing...' : `⚡ Complete (+${quest.xp_reward} XP)`}
              </motion.button>
            ) : (
              <div className="flex-1 text-center py-3 sm:py-4 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✅ Quest Completed
              </div>
            )}
            <button onClick={onClose}
              className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium transition-all text-sm"
              style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)', border: '1px solid var(--color-verse-border)' }}>
              ✕
            </button>
          </div>
        </div>
      </motion.div>
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

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDailyQuests();
        setQuests(data.quests || []);
      } catch (err) {
        console.error('Quest load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getQuestHistory();
      setHistory(data.quests || []);
      setShowHistory(true);
    } catch (err) {
      console.error('History load error:', err);
    }
  };

  const handleComplete = async (quest) => {
    if (completing) return;
    setCompleting(true);
    try {
      const result = await api.completeQuest(quest.id);
      setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: 1 } : q));
      setCompletionResult(result);
      updateUser(result.user);
      if (selectedQuest?.id === quest.id) setSelectedQuest({ ...quest, completed: 1 });
      setTimeout(() => setCompletionResult(null), 5000);
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setCompleting(false);
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
              className="glass-card p-6 sm:p-10 text-center w-full max-w-sm"
              style={{ border: '1px solid var(--color-spider-gold)' }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: 3 }} className="text-5xl sm:text-6xl mb-3 sm:mb-4">
                ⚡
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--color-spider-gold)' }}>
                +{completionResult.xpResult?.xpGained || 0} XP
              </h2>
              {completionResult.xpResult?.streakBonus > 0 && (
                <p className="text-xs sm:text-sm mb-1" style={{ color: 'var(--color-spider-red-light)' }}>
                  🔥 Streak Bonus: +{completionResult.xpResult.streakBonus} XP
                </p>
              )}
              {completionResult.xpResult?.leveledUp && (
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  className="text-xl sm:text-2xl font-bold mt-3" style={{ color: 'var(--color-spider-red)' }}>
                  🎉 LEVEL UP! Level {completionResult.xpResult.newLevel}
                </motion.p>
              )}
              {completionResult.bossBonus && (
                <div className="mt-3 sm:mt-4 p-3 rounded-lg" style={{ background: 'rgba(220,20,60,0.15)' }}>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-spider-red-light)' }}>{completionResult.bossBonus.message}</p>
                  <p className="text-xs" style={{ color: 'var(--color-spider-gold)' }}>+{completionResult.bossBonus.xp} bonus XP</p>
                </div>
              )}
              <button onClick={() => setCompletionResult(null)} className="spider-btn mt-4 sm:mt-6 text-sm">Continue 🕸️</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="max-w-4xl mx-auto mobile-safe">
        <div className="flex items-center justify-between mb-5 sm:mb-8 gap-3">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-extrabold">
            ⚔️ Quest Board
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={showHistory ? () => setShowHistory(false) : loadHistory}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-all shrink-0"
            style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)', color: 'var(--color-verse-muted)' }}
          >
            {showHistory ? '📋 Today' : '📜 History'}
          </motion.button>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--color-verse-muted)' }}>
          💡 Tap any quest to see full details and steps.
        </motion.p>

        {/* Quest List */}
        <div className="space-y-3 sm:space-y-4">
          {(showHistory ? history : quests).map((quest, i) => {
            const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
            const { details } = parseDetails(quest);
            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="glass-card overflow-hidden cursor-pointer group"
                style={{ opacity: quest.completed ? 0.7 : 1 }}
                onClick={() => setSelectedQuest(quest)}
              >
                <div className="p-4 sm:p-5" style={{ background: style.gradient }}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon — smaller on mobile */}
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-2xl shrink-0"
                      style={{ background: `${style.color}15`, border: `1px solid ${style.color}30` }}>
                      {quest.completed ? '✅' : style.icon}
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
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-spider-gold)' }}>+{quest.xp_reward} XP</span>
                        <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-verse-muted)' }}>📂 {quest.domain}</span>
                      </div>
                    </div>
                    {!quest.completed && !showHistory && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                        disabled={completing}
                        className="spider-btn text-xs shrink-0 hidden sm:block"
                      >
                        Complete
                      </motion.button>
                    )}
                  </div>
                  {/* Mobile complete button — full width at bottom */}
                  {!quest.completed && !showHistory && (
                    <div className="sm:hidden mt-3 pt-3" style={{ borderTop: `1px solid ${style.color}20` }}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                        disabled={completing}
                        className="spider-btn text-xs w-full text-center py-2.5"
                      >
                        ⚡ Complete Quest
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
            <p className="text-4xl sm:text-5xl mb-4">📜</p>
            <p className="text-sm">No quest history yet. Complete your first quest!</p>
          </div>
        )}
      </div>
    </div>
  );
}
