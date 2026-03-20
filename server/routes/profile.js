import { Router } from 'express';
import { getSupabaseClient } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { getXpProgress } from '../services/xpSystem.js';

const router = Router();

// GET /api/profile - Full profile stats
router.get('/', authMiddleware, async (req, res) => {
  console.log(`[profile] Fetching profile for user ${req.userId}...`);
  try {
    const db = getSupabaseClient();
    const { data: user, error: userError } = await db
      .from('users')
      .select('id, username, email, xp, level, streak, longest_streak, created_at')
      .eq('id', req.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const xpProgress = getXpProgress(user);

    const { count: totalQuests } = await db
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .eq('completed', 1);

    const { count: totalSkills } = await db
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    const { data: achievements } = await db
      .from('achievements')
      .select('*')
      .eq('user_id', req.userId)
      .order('unlocked_at', { ascending: false });

    const { data: topSkills } = await db
      .from('skills')
      .select('name, xp, quest_count, color')
      .eq('user_id', req.userId)
      .order('xp', { ascending: false })
      .limit(5);

    const { data: activeEvent } = await db
      .from('random_events')
      .select('*')
      .eq('user_id', req.userId)
      .eq('active', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const daysSinceJoin = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / 86400000
    ) + 1;

    res.json({
      user,
      xpProgress,
      stats: {
        totalQuests: totalQuests || 0,
        totalSkills: totalSkills || 0,
        daysSinceJoin,
        questsPerDay: totalQuests > 0 ? (totalQuests / daysSinceJoin).toFixed(1) : 0
      },
      achievements: achievements || [],
      topSkills: topSkills || [],
      activeEvent
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

export default router;
