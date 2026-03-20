import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { supabase } from '../db/supabase.js';
import { sendOTP } from '../utils/email.js';

const router = Router();

// In-memory cache for OTPs 
// Structure: { 'email@example.com': { otp: '123456', expires: 1689234857000, attempts: 0, pendingUser: { username, password } } }
const otpCache = new Map();

const generate6DigitOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const isNoRowsError = (error) => error?.code === 'PGRST116';
const isMissingTableError = (error) => error?.code === 'PGRST205';

// ==========================================
// REGISTRATION (SIGNUP)
// ==========================================

// POST /api/auth/signup-request
router.post('/signup-request', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUserError && !isNoRowsError(existingUserError)) {
      if (isMissingTableError(existingUserError)) {
        return res.status(500).json({ error: 'Database is not initialized. Run SQL migrations in Supabase first.' });
      }
      throw existingUserError;
    }

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Check if username is taken
    const { data: existingUsername, error: existingUsernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .single();

    if (existingUsernameError && !isNoRowsError(existingUsernameError)) {
      if (isMissingTableError(existingUsernameError)) {
        return res.status(500).json({ error: 'Database is not initialized. Run SQL migrations in Supabase first.' });
      }
      throw existingUsernameError;
    }

    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // 1. Generate OTP and expiry (5 minutes)
    const otp = generate6DigitOTP();
    const expires = Date.now() + 5 * 60 * 1000;

    // 2. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Store pending signup in cache so we can create it after OTP verification
    otpCache.set(normalizedEmail, { 
      otp, 
      expires, 
      attempts: 0, 
      type: 'signup',
      pendingUser: { username: normalizedUsername, password_hash } 
    });

    // 4. Send via email
    await sendOTP(normalizedEmail, otp);

    res.json({ message: 'OTP sent to email. Please verify to complete signup.' });
  } catch (err) {
    console.error('Signup request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/signup-verify
router.post('/signup-verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const normalizedEmail = email.toLowerCase().trim();
    const cachedData = otpCache.get(normalizedEmail);

    if (!cachedData || cachedData.type !== 'signup') {
      return res.status(401).json({ error: 'No signup in progress or OTP expired' });
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

    // OTP is valid! Create the user in Supabase
    const { username, password_hash } = cachedData.pendingUser;
    const today = new Date().toISOString().split('T')[0];

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ 
        email: normalizedEmail, 
        username, 
        password_hash,
        last_active: today 
      }])
      .select()
      .single();

    if (insertError) {
      if (isMissingTableError(insertError)) {
        return res.status(500).json({ error: 'Database is not initialized. Run SQL migrations in Supabase first.' });
      }
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Account already exists. Please login instead.' });
      }
      throw insertError;
    }

    // Grant first achievement for new users
    const { error: achievementError } = await supabase.from('achievements').insert([{
      user_id: newUser.id,
      name: 'Web Slinger Initiate',
      description: 'Joined the Spider-Verse Quest Engine',
      icon: '🕸️',
      category: 'milestone'
    }]);

    if (achievementError && !isMissingTableError(achievementError)) {
      console.warn('Achievement insert warning:', achievementError);
    }

    // Cleanup cache
    otpCache.delete(normalizedEmail);

    // Generate token
    const token = generateToken(newUser.id);

    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        xp: newUser.xp,
        level: newUser.level,
        streak: newUser.streak
      }
    });

  } catch (err) {
    console.error('Signup verify error:', err);
    if (isMissingTableError(err)) {
      return res.status(500).json({ error: 'Database is not initialized. Run SQL migrations in Supabase first.' });
    }
    res.status(500).json({ error: 'Server error creating account' });
  }
});

// ==========================================
// LOGIN
// ==========================================

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user including the password hash
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    // If user doesn't exist, generic error
    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    if (!user.password_hash) {
      // Legacy account that might have no password set properly
      return res.status(401).json({ error: 'This account uses OTP or has no password set. Please use forgot password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let streak = user.streak || 0;

    if (user.last_active === yesterday) {
      streak += 1;
    } else if (user.last_active !== today) {
      streak = 1;
    }

    const longestStreak = Math.max(streak, user.longest_streak || 0);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ last_active: today, streak, longest_streak: longestStreak })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update user error:', updateError);
      // If update fails, use original user data
    }

    const finalUser = updatedUser || user;

    // Return token
    const token = generateToken(finalUser.id);
    res.json({
      token,
      user: {
        id: finalUser.id,
        username: finalUser.username,
        email: finalUser.email,
        xp: finalUser.xp,
        level: finalUser.level,
        streak: finalUser.streak
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});


// ==========================================
// FORGOT PASSWORD
// ==========================================

// POST /api/auth/forgot-password-request
router.post('/forgot-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      return res.json({ message: 'If an account exists, an OTP will be sent.' });
    }

    const otp = generate6DigitOTP();
    const expires = Date.now() + 5 * 60 * 1000;

    otpCache.set(normalizedEmail, { otp, expires, attempts: 0, type: 'reset' });

    await sendOTP(normalizedEmail, otp);

    res.json({ message: 'If an account exists, an OTP will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password-reset
router.post('/forgot-password-reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cachedData = otpCache.get(normalizedEmail);

    if (!cachedData || cachedData.type !== 'reset') {
      return res.status(401).json({ error: 'No reset requested or OTP expired' });
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

    // OTP is valid! Update the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('email', normalizedEmail)
      .select('id')
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'Account not found' });
    }

    otpCache.delete(normalizedEmail);

    res.json({ message: 'Password has been reset successfully. You can now login.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

// ==========================================
// USER MANIPULATION
// ==========================================

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

// PUT /api/auth/username
router.put('/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const normalizedUsername = username?.trim();

    if (!normalizedUsername || normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Check availability
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .neq('id', req.userId)
      .single();

    if (existingError && !isNoRowsError(existingError)) {
      throw existingError;
    }

    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ username: normalizedUsername })
      .eq('id', req.userId)
      .select('id, username, email, xp, level, streak')
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from old password' });
    }

    // Fetch user with password hash
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Your account does not have a password set. Please use forgot password.' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', req.userId);

    if (updateError) throw updateError;

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

export default router;
