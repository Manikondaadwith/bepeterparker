import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { getXpProgress } from '../services/xpSystem.js';

const router = Router();

// GET /api/profile - Full profile stats
router.get('/', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, xp, level, streak, longest_streak, created_at FROM users WHERE id = ?'
  ).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const xpProgress = getXpProgress(user);

  const totalQuests = db.prepare(
    'SELECT COUNT(*) as count FROM quests WHERE user_id = ? AND completed = 1'
  ).get(req.userId).count;

  const totalSkills = db.prepare(
    'SELECT COUNT(*) as count FROM skills WHERE user_id = ?'
  ).get(req.userId).count;

  const achievements = db.prepare(
    'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC'
  ).all(req.userId);

  const topSkills = db.prepare(
    'SELECT name, xp, quest_count, color FROM skills WHERE user_id = ? ORDER BY xp DESC LIMIT 5'
  ).all(req.userId);

  const activeEvent = db.prepare(
    'SELECT * FROM random_events WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1'
  ).get(req.userId);

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / 86400000
  ) + 1;

  res.json({
    user,
    xpProgress,
    stats: {
      totalQuests,
      totalSkills,
      daysSinceJoin,
      questsPerDay: totalQuests > 0 ? (totalQuests / daysSinceJoin).toFixed(1) : 0
    },
    achievements,
    topSkills,
    activeEvent
  });
});

export default router;
