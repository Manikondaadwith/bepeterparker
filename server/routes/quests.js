import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateDailyQuests, updateSkill, checkQuestAchievements } from '../services/questGenerator.js';
import { awardXP, getXpProgress, maybeGenerateRandomEvent } from '../services/xpSystem.js';

const router = Router();

// GET /api/quests/daily - Get or generate today's quests
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const quests = await generateDailyQuests(req.userId);
    const randomEvent = await maybeGenerateRandomEvent(req.userId);

    // Get active event
    const { data: activeEvent } = await supabase
      .from('random_events')
      .select('*')
      .eq('user_id', req.userId)
      .eq('active', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({ quests, randomEvent: activeEvent || randomEvent });
  } catch (err) {
    console.error('Quest generation error:', err);
    res.status(500).json({ error: 'Failed to generate quests' });
  }
});

// POST /api/quests/:id/complete - Complete a quest
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.status(400).json({ error: 'Quest already completed' });

    // Mark complete
    await supabase
      .from('quests')
      .update({ completed: 1, completed_at: new Date().toISOString() })
      .eq('id', quest.id);

    // Award XP
    const xpResult = await awardXP(req.userId, quest.xp_reward);

    // Update skill nodes
    await updateSkill(req.userId, quest.domain);

    // Check achievements
    await checkQuestAchievements(req.userId);

    // Get updated user
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, xp, level, streak')
      .eq('id', req.userId)
      .single();

    const xpProgress = getXpProgress(user);

    // Check if all daily quests are done (boss battle opportunity)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayQuests } = await supabase
      .from('quests')
      .select('completed')
      .eq('user_id', req.userId)
      .eq('quest_date', today);

    const allDone = todayQuests && todayQuests.every(q => q.completed);

    let bossBonus = null;
    if (allDone) {
      const bonusXP = await awardXP(req.userId, 50);
      bossBonus = { message: '🕷️ BOSS BATTLE WON! All daily quests completed!', xp: bonusXP.xpGained };

      await supabase
        .from('achievements')
        .insert([{ user_id: req.userId, name: 'Daily Dominator', description: 'Completed all quests in a single day', icon: '⚡', category: 'daily' }])
        .select()
        .maybeSingle(); // Ignore if exists
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
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    res.json({ quests: quests || [] });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
