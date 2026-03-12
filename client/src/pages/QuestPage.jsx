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
  // Details are stored as JSON after \n\n in description
  const parts = (quest.description || '').split('\n\n');
  const mainDesc = parts[0] || quest.description;
  let details = null;
  // Try to find JSON in the parts
  for (let i = 1; i < parts.length; i++) {
    try {
      details = JSON.parse(parts[i]);
      break;
    } catch(e) { /* not JSON */ }
  }
  // Also check quest.details directly
  if (!details && quest.details) {
    details = typeof quest.details === 'string' ? JSON.parse(quest.details) : quest.details;
  }
  return { mainDesc, details };
}

// Quest Detail Modal
function QuestDetailModal({ quest, onClose, onComplete, completing }) {
  const style = QUEST_STYLES[quest.type] || QUEST_STYLES.side;
  const { mainDesc, details } = parseDetails(quest);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="glass-card overflow-hidden" style={{ border: `1px solid ${style.color}40` }}>
          {/* Header with gradient */}
          <div className="relative p-6 pb-4" style={{ background: style.gradient }}>
            {/* Thumbnail if available */}
            {details?.thumbnail && (
              <div className="absolute inset-0 opacity-20">
                <img src={details.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{style.icon}</span>
                <div>
                  <span className="text-xs font-bold tracking-widest block" style={{ color: style.accent }}>
                    {style.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                    via {quest.source}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {details?.difficulty && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                      background: details.difficulty === 'Hard' ? 'rgba(220,20,60,0.2)' :
                                  details.difficulty === 'Medium' ? 'rgba(255,215,0,0.2)' : 'rgba(16,185,129,0.2)',
                      color: details.difficulty === 'Hard' ? '#FF4466' :
                             details.difficulty === 'Medium' ? '#FBBF24' : '#34D399',
                    }}>
                      {details.difficulty}
                    </span>
                  )}
                  {details?.timeEstimate && (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                      ⏱ {details.timeEstimate}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-extrabold leading-tight">
                {quest.title.replace(/^[^\:]+:\s*/, '')}
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--color-spider-gold)' }}>
                  +{quest.xp_reward} XP
                </span>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                  📂 {quest.domain}
                </span>
                {quest.completed ? (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                    ✅ Completed
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Mission Brief */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: style.accent }}>
                🎯 Mission Brief
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                {mainDesc}
              </p>
            </div>

            {/* About This Topic */}
            {details?.fullDescription && (
              <div className="p-4 rounded-xl" style={{ background: 'var(--color-verse-surface)', border: '1px solid var(--color-verse-border)' }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                  📖 About This Topic
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-verse-text)' }}>
                  {details.fullDescription.substring(0, 500)}
                </p>
              </div>
            )}

            {/* Steps */}
            {details?.steps && details.steps.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: style.accent }}>
                  📋 Quest Steps
                </h3>
                <div className="space-y-2">
                  {details.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--color-verse-surface)' }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: `${style.color}30`, color: style.accent }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-verse-text)' }}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Why It Matters */}
            {details?.whyItMatters && (
              <div className="p-4 rounded-xl" style={{ background: `${style.color}08`, border: `1px solid ${style.color}20` }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: style.accent }}>
                  🧠 Why It Matters
                </h3>
                <p className="text-sm leading-relaxed italic" style={{ color: 'var(--color-verse-text)' }}>
                  {details.whyItMatters}
                </p>
              </div>
            )}

            {/* Tips */}
            {details?.tips && details.tips.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-verse-muted)' }}>
                  💡 Pro Tips
                </h3>
                <ul className="space-y-1.5">
                  {details.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-verse-muted)' }}>
                      <span style={{ color: 'var(--color-spider-gold)' }}>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source Link */}
            {details?.sourceUrl && (
              <a
                href={details.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm p-3 rounded-lg transition-all hover:brightness-125"
                style={{ background: 'var(--color-verse-surface)', color: style.accent, border: '1px solid var(--color-verse-border)' }}
              >
                🔗 Read More / Source Material
                <span className="ml-auto text-xs" style={{ color: 'var(--color-verse-muted)' }}>↗</span>
              </a>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex items-center gap-3">
            {!quest.completed ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onComplete(quest)}
                disabled={completing}
                className="spider-btn flex-1 text-center py-4 text-lg font-bold"
              >
                {completing ? '⏳ Processing...' : `⚡ Complete Quest (+${quest.xp_reward} XP)`}
              </motion.button>
            ) : (
              <div className="flex-1 text-center py-4 rounded-xl font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✅ Quest Completed
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-xl font-medium transition-all hover:brightness-125"
              style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)', border: '1px solid var(--color-verse-border)' }}
            >
              Close
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
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: 'var(--color-verse-bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <span className="text-5xl">🕸️</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4" style={{ background: 'var(--color-verse-bg)' }}>
      {/* Completion Overlay */}
      <AnimatePresence>
        {completionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setCompletionResult(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="glass-card p-10 text-center max-w-md mx-4"
              style={{ border: '1px solid var(--color-spider-gold)' }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: 3 }} className="text-6xl mb-4">
                ⚡
              </motion.div>
              <h2 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--color-spider-gold)' }}>
                +{completionResult.xpResult?.xpGained || 0} XP
              </h2>
              {completionResult.xpResult?.streakBonus > 0 && (
                <p className="text-sm mb-1" style={{ color: 'var(--color-spider-red-light)' }}>
                  🔥 Streak Bonus: +{completionResult.xpResult.streakBonus} XP
                </p>
              )}
              {completionResult.xpResult?.leveledUp && (
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-2xl font-bold mt-3" style={{ color: 'var(--color-spider-red)' }}>
                  🎉 LEVEL UP! Level {completionResult.xpResult.newLevel}
                </motion.p>
              )}
              {completionResult.bossBonus && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(220,20,60,0.15)' }}>
                  <p className="font-bold" style={{ color: 'var(--color-spider-red-light)' }}>{completionResult.bossBonus.message}</p>
                  <p className="text-sm" style={{ color: 'var(--color-spider-gold)' }}>+{completionResult.bossBonus.xp} bonus XP</p>
                </div>
              )}
              <button onClick={() => setCompletionResult(null)} className="spider-btn mt-6 text-sm">Continue 🕸️</button>
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

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-extrabold">
            ⚔️ Quest Board
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={showHistory ? () => setShowHistory(false) : loadHistory}
            className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
            style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)', color: 'var(--color-verse-muted)' }}
          >
            {showHistory ? '📋 Today' : '📜 History'}
          </motion.button>
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm mb-6"
          style={{ color: 'var(--color-verse-muted)' }}
        >
          💡 Click on any quest to see full details, steps, and resources.
        </motion.p>

        {/* Quest List */}
        <div className="space-y-4">
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
                <div className="p-5" style={{ background: style.gradient }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${style.color}15`, border: `1px solid ${style.color}30` }}>
                      {quest.completed ? '✅' : style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold tracking-widest" style={{ color: style.accent }}>
                          {style.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-verse-panel)', color: 'var(--color-verse-muted)' }}>
                          {quest.source}
                        </span>
                        {details?.difficulty && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: details.difficulty === 'Hard' ? 'rgba(220,20,60,0.15)' :
                                        details.difficulty === 'Medium' ? 'rgba(255,215,0,0.15)' : 'rgba(16,185,129,0.15)',
                            color: details.difficulty === 'Hard' ? '#FF4466' :
                                   details.difficulty === 'Medium' ? '#FBBF24' : '#34D399',
                          }}>
                            {details.difficulty}
                          </span>
                        )}
                        {details?.timeEstimate && (
                          <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>
                            ⏱ {details.timeEstimate}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{quest.title.replace(/^[^\:]+:\s*/, '')}</h3>
                      <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-verse-muted)' }}>
                        {quest.description.split('\n\n')[0]}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-spider-gold)' }}>+{quest.xp_reward} XP</span>
                        <span className="text-xs" style={{ color: 'var(--color-verse-muted)' }}>📂 {quest.domain}</span>
                        <span className="text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: style.accent }}>
                          Click for details →
                        </span>
                      </div>
                    </div>
                    {!quest.completed && !showHistory && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleComplete(quest); }}
                        disabled={completing}
                        className="spider-btn text-sm shrink-0"
                      >
                        Complete
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {showHistory && history.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--color-verse-muted)' }}>
            <p className="text-5xl mb-4">📜</p>
            <p>No quest history yet. Complete your first quest!</p>
          </div>
        )}
      </div>
    </div>
  );
}
