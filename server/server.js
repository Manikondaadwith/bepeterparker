import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import questRoutes from './routes/quests.js';
import skillRoutes from './routes/skills.js';
import profileRoutes from './routes/profile.js';
import assistantRoutes from './routes/assistant.js';
import notificationRoutes from './routes/notifications.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const normalizeOrigin = (value) => value?.trim().replace(/\/$/, '');
const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:5176', 'http://localhost:3000'];

// CORS — allow configured origins + localhost for dev
const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(normalizeOrigin).filter(Boolean)
  : [];

const allowedOrigins = process.env.CORS_ORIGINS
  ? [
    ...new Set([
      ...configuredOrigins,
      ...(process.env.NODE_ENV !== 'production' ? defaultDevOrigins : []),
    ])
  ]
  : defaultDevOrigins;

if (process.env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
  console.warn('[cors] CORS_ORIGINS contains "*" in production. Consider using explicit origins.');
}

app.use(cors({
  origin(origin, callback) {
    console.log(`[cors] Request from origin: ${origin || 'no-origin'}`);
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
      console.log(`[cors] Origin ${normalizedOrigin} is ALLOWED.`);
      return callback(null, true);
    }
    
    // On Vercel, if origin matches the host, it's usually safe
    if (process.env.VERCEL) {
       console.log(`[cors] Vercel environment detected. Allowing same-site request.`);
       return callback(null, true);
    }

    console.warn(`[cors] Origin ${normalizedOrigin} is REJECTED.`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// Database is initialized via Supabase client

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🕷️ Spider-Verse Quest Engine is running' });
});

// ---------- Production: serve React build ----------
// On localhost/VPS, Express serves both. On Vercel, the edge network handles it.
if (!process.env.VERCEL) {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));

  // SPA fallback — any non-API route serves index.html so React Router works
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler to prevent HTML stack traces on API errors
app.use((err, req, res, next) => {
  console.error("Global Error Caught:", err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: "Internal Server Error",
    message: err.message, // Expose for debugging even in production
    path: req.path
  });
});

// Only listen if not on Vercel or in development
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🕷️  Spider-Verse Quest Engine Backend`);
    console.log(`🌐  Server running on http://localhost:${PORT}`);
    console.log(`📦  Database: Supabase PostgreSQL (OTP Flow Active)\n`);
  });
}

export default app;
