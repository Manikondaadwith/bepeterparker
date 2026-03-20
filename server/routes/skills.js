import { Router } from 'express';
import { getSupabaseClient } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/skills - Get user's skill nodes
router.get('/', authMiddleware, async (req, res) => {
  console.log(`[skills] Fetching skills for user ${req.userId}...`);
  try {
    const db = getSupabaseClient();
    const { data: skills, error } = await db
      .from('skills')
      .select('*')
      .eq('user_id', req.userId)
      .order('xp', { ascending: false });

    if (error) {
      console.error('[skills] Fetch error:', error.message);
      throw error;
    }
    
    res.json({ skills: skills || [] });
  } catch (err) {
    console.error('Skills fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

export default router;
