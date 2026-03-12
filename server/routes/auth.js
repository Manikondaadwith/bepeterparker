import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const today = new Date().toISOString().split('T')[0];

    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, last_active) VALUES (?, ?, ?, ?)'
    ).run(username, email, password_hash, today);

    const token = generateToken(result.lastInsertRowid);

    // Grant first achievement
    try {
      db.prepare(
        'INSERT INTO achievements (user_id, name, description, icon, category) VALUES (?, ?, ?, ?, ?)'
      ).run(result.lastInsertRowid, 'Web Slinger Initiate', 'Joined the Spider-Verse Quest Engine', '🕸️', 'milestone');
    } catch (e) { /* ignore duplicate */ }

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        email,
        xp: 0,
        level: 1,
        streak: 0
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak = user.streak;
    if (user.last_active === yesterday) {
      streak += 1;
    } else if (user.last_active !== today) {
      streak = 1;
    }

    const longestStreak = Math.max(streak, user.longest_streak);
    db.prepare('UPDATE users SET last_active = ?, streak = ?, longest_streak = ? WHERE id = ?')
      .run(today, streak, longestStreak, user.id);

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, xp, level, streak, longest_streak, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
