import express from 'express';
import cors from 'cors';
import { initDB } from './db/schema.js';
import authRoutes from './routes/auth.js';
import questRoutes from './routes/quests.js';
import skillRoutes from './routes/skills.js';
import profileRoutes from './routes/profile.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Initialize database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🕷️ Spider-Verse Quest Engine is running' });
});

app.listen(PORT, () => {
  console.log(`\n🕷️  Spider-Verse Quest Engine Backend`);
  console.log(`🌐  Server running on http://localhost:${PORT}`);
  console.log(`📦  Database: SQLite (spiderverse.db)\n`);
});
