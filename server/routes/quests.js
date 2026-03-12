import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateDailyQuests, updateSkill, checkQuestAchievements } from '../services/questGenerator.js';
import { awardXP, getXpProgress, maybeGenerateRandomEvent } from '../services/xpSystem.js';

const router = Router();

// GET /api/quests/daily - Get or generate today's quests
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const quests = await generateDailyQuests(req.userId);
    const randomEvent = maybeGenerateRandomEvent(req.userId);

    // Get active event
    const activeEvent = db.prepare(
      'SELECT * FROM random_events WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(req.userId);

    res.json({ quests, randomEvent: activeEvent || randomEvent });
  } catch (err) {
    console.error('Quest generation error:', err);
    res.status(500).json({ error: 'Failed to generate quests' });
  }
});

// POST /api/quests/:id/complete - Complete a quest
router.post('/:id/complete', authMiddleware, (req, res) => {
  try {
    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.status(400).json({ error: 'Quest already completed' });

    // Mark complete
    db.prepare('UPDATE quests SET completed = 1, completed_at = datetime(\'now\') WHERE id = ?').run(quest.id);

    // Award XP
    const xpResult = awardXP(req.userId, quest.xp_reward);

    // Update skill nodes
    updateSkill(req.userId, quest.domain);

    // Check achievements
    checkQuestAchievements(req.userId);

    // Get updated user
    const user = db.prepare('SELECT id, username, email, xp, level, streak FROM users WHERE id = ?').get(req.userId);
    const xpProgress = getXpProgress(user);

    // Check if all daily quests are done (boss battle opportunity)
    const today = new Date().toISOString().split('T')[0];
    const todayQuests = db.prepare('SELECT * FROM quests WHERE user_id = ? AND quest_date = ?').all(req.userId, today);
    const allDone = todayQuests.every(q => q.completed);

    let bossBonus = null;
    if (allDone) {
      const bonusXP = awardXP(req.userId, 50);
      bossBonus = { message: '🕷️ BOSS BATTLE WON! All daily quests completed!', xp: bonusXP.xpGained };

      try {
        db.prepare(
          'INSERT OR IGNORE INTO achievements (user_id, name, description, icon, category) VALUES (?, ?, ?, ?, ?)'
        ).run(req.userId, 'Daily Dominator', 'Completed all quests in a single day', '⚡', 'daily');
      } catch (e) { /* ignore */ }
    }

    res.json({
      success: true,
      xpResult,
      xpProgress,
      user,
      bossBonus,
      quest: { ...quest, completed: 1 }
    });
  } catch (err) {
    console.error('Quest complete error:', err);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// GET /api/quests/history - Quest history
router.get('/history', authMiddleware, (req, res) => {
  const quests = db.prepare(
    'SELECT * FROM quests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.userId);
  res.json({ quests });
});

export default router;
