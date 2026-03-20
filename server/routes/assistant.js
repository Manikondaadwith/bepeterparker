import { Router } from 'express';
import { getSupabaseClient } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateAssistantReply } from '../services/edithEngine.js';

const router = Router();

/**
 * POST /api/assistant
 * EDITH AI Assistant — conversational AI that knows the user's quest context.
 * Uses OpenRouter via edithEngine for fast, intelligent responses
 */
router.post('/', authMiddleware, async (req, res) => {
  console.log(`[assistant] Processing request for user ${req.userId}...`);
  try {
    const { message } = req.body;
    const db = getSupabaseClient();
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Gather user context
    const [userResult, questsResult, skillsResult] = await Promise.all([
      db.from('users').select('username, level, xp, streak').eq('id', req.userId).single(),
      db.from('quests').select('title, domain, completed, xp_reward, quest_date')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false })
        .limit(12),
      db.from('skills').select('domain, xp').eq('user_id', req.userId).order('xp', { ascending: false }).limit(10),
    ]);

    const user = userResult.data || {};
    const recentQuests = questsResult.data || [];
    const skills = skillsResult.data || [];

    const topSkills = skills.slice(0, 3).map(s => `${s.domain} (${s.xp} XP)`).join(', ');

    const reply = await generateAssistantReply(user, message, { recentQuests, topSkills });

    res.json({ reply });

  } catch (err) {
    console.error('Assistant route error:', err);
    res.status(500).json({ 
      reply: "My systems are momentarily offline, but I'll be back. Try again in a moment, hero." 
    });
  }
});

export default router;
