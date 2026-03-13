import { Router } from 'express';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { supabase } from '../db/supabase.js';
import { sendOTP } from '../utils/email.js';

const router = Router();

// In-memory cache for OTPs 
// Structure: { 'email@example.com': { otp: '123456', expires: 1689234857000, attempts: 0 } }
// NOTE: For a multi-instance production app, this would be stored in Redis or Supabase.
// Since this is a single instance backend for a single user, memory is perfectly fine.
const otpCache = new Map();

// Helper to generate a 6-digit strictly numerical OTP
const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Generate OTP and expiry (5 minutes)
    const otp = generate6DigitOTP();
    const expires = Date.now() + 5 * 60 * 1000;

    // 2. Store in cache
    otpCache.set(normalizedEmail, { otp, expires, attempts: 0 });

    // 3. Send via email
    const emailResult = await sendOTP(normalizedEmail, otp);
    if (!emailResult.success) {
      console.error('Email failed:', emailResult.error);
      // We still return success to the client so we don't leak failures if SMTP is misconfigured in dev, 
      // but in a real app you might want to handle this differently.
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Request OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cachedData = otpCache.get(normalizedEmail);

    if (!cachedData) {
      return res.status(401).json({ error: 'No OTP requested or OTP expired' });
    }

    if (Date.now() > cachedData.expires) {
      otpCache.delete(normalizedEmail);
      return res.status(401).json({ error: 'OTP has expired' });
    }

    if (cachedData.attempts >= 3) {
      otpCache.delete(normalizedEmail);
      return res.status(429).json({ error: 'Too many failed attempts. Request a new OTP.' });
    }

    if (cachedData.otp !== otp) {
      cachedData.attempts += 1;
      return res.status(401).json({ error: 'Invalid OTP code' });
    }

    // OTP is valid! Clear it.
    otpCache.delete(normalizedEmail);

    // Proceed to log the user in or create them
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let dbUser = user;

    if (fetchError || !user) {
      // User doesn't exist yet! Create them.
      // Generate a default username if completely new
      const defaultUsername = `Spider_${Math.round(Math.random() * 9999)}`;
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ 
          email: normalizedEmail, 
          username: defaultUsername, 
          last_active: today 
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      dbUser = newUser;

      // Grant first achievement for new users
      await supabase
        .from('achievements')
        .insert([{
          user_id: dbUser.id,
          name: 'Web Slinger Initiate',
          description: 'Joined the Spider-Verse Quest Engine',
          icon: '🕸️',
          category: 'milestone'
        }]);

    } else {
      // User exists, update streak
      let streak = dbUser.streak;
      if (dbUser.last_active === yesterday) {
        streak += 1;
      } else if (dbUser.last_active !== today) {
        streak = 1;
      }

      const longestStreak = Math.max(streak, dbUser.longest_streak);
      
      // Upsert update
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_active: today, streak, longest_streak })
        .eq('id', dbUser.id)
        .select()
        .single();

      if (!updateError && updatedUser) {
        dbUser = updatedUser;
      }
    }

    // Generate JWT specific to our Node backend (matching existing AuthMiddleware expectations)
    // Supabase returns massive UUIDs by default, but our old SQLite used integer IDs.
    // The new Supabase schema uses BIGINT for IDs, so our JWT payload remains integer-compatible.
    const token = generateToken(dbUser.id);

    res.json({
      token,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        xp: dbUser.xp,
        level: dbUser.level,
        streak: dbUser.streak
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, xp, level, streak, longest_streak, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Get Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/username (Allow updating the auto-generated username)
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Check availability
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', req.userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', req.userId)
      .select('id, username, email, xp, level, streak')
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
