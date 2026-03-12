import { Router } from 'express';
import db from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/skills - Get user's skill nodes
router.get('/', authMiddleware, (req, res) => {
  const skills = db.prepare(
    'SELECT * FROM skills WHERE user_id = ? ORDER BY xp DESC'
  ).all(req.userId);
  res.json({ skills });
});

export default router;
