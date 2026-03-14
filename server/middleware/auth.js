import jwt from 'jsonwebtoken';

const DEV_FALLBACK_JWT_SECRET = 'spiderverse-quest-engine-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth] JWT_SECRET must be set in production.');
  }
  console.warn('[auth] JWT_SECRET is not set. Using development fallback secret.');
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
