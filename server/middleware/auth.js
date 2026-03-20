import jwt from 'jsonwebtoken';
/**
 * Lazy-loads the JWT secret to prevent top-level crashes.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET;
  
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('[auth] CRITICAL: JWT_SECRET is missing in production environment!');
    // We throw inside the handler, not at the top level
    return null; 
  }
  return secret;
};

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({ error: 'Authentication system misconfigured' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    // Add req.user for compatibility with routes using that pattern
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Alias for consistency across routes
export const authenticateToken = authMiddleware;

export function generateToken(userId) {
  const secret = getJwtSecret();
  if (!secret) throw new Error('Cannot generate token: JWT_SECRET missing');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export const getJWTSecret = getJwtSecret;
