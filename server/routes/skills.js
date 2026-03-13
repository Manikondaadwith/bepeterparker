import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/skills - Get user's skill nodes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: skills, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', req.userId)
      .order('xp', { ascending: false });

    if (error) throw error;
    
    res.json({ skills: skills || [] });
  } catch (err) {
    console.error('Skills fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

export default router;
