import db from '../db/schema.js';

// XP required to reach a given level: 100 * level^1.5
export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Get total XP needed from level 1 to target level
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

// Calculate XP progress within current level
export function getXpProgress(user) {
  const xpForCurrent = totalXpForLevel(user.level);
  const xpIntoLevel = user.xp - xpForCurrent;
  const xpNeeded = xpRequiredForLevel(user.level);
  return {
    currentXp: Math.max(0, xpIntoLevel),
    requiredXp: xpNeeded,
    percentage: Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100))
  };
}

// Award XP and handle level ups
export function awardXP(userId, baseXP) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  // Streak bonus: +5% per streak day, max +50%
  const streakBonus = Math.min(0.5, user.streak * 0.05);

  // Check for active random events
  const activeEvent = db.prepare(
    'SELECT * FROM random_events WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1'
  ).get(userId);
  const eventModifier = activeEvent ? activeEvent.xp_modifier : 1.0;

  const totalXP = Math.floor(baseXP * (1 + streakBonus) * eventModifier);
  const newXP = user.xp + totalXP;

  // Calculate new level
  let newLevel = user.level;
  while (totalXpForLevel(newLevel + 1) <= newXP) {
    newLevel++;
  }

  const leveledUp = newLevel > user.level;

  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXP, newLevel, userId);

  // Check level-based achievements
  checkLevelAchievements(userId, newLevel);

  return {
    xpGained: totalXP,
    streakBonus: Math.floor(baseXP * streakBonus),
    eventBonus: activeEvent ? activeEvent.title : null,
    newXP,
    newLevel,
    leveledUp
  };
}

function checkLevelAchievements(userId, level) {
  const milestones = [
    { level: 5, name: 'Friendly Neighborhood', desc: 'Reached Level 5', icon: '🏘️' },
    { level: 10, name: 'Web Warrior', desc: 'Reached Level 10', icon: '⚔️' },
    { level: 20, name: 'Spider Champion', desc: 'Reached Level 20', icon: '🏆' },
    { level: 50, name: 'Multiverse Legend', desc: 'Reached Level 50', icon: '🌌' },
  ];

  for (const m of milestones) {
    if (level >= m.level) {
      try {
        db.prepare(
          'INSERT OR IGNORE INTO achievements (user_id, name, description, icon, category) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, m.name, m.desc, m.icon, 'level');
      } catch (e) { /* ignore */ }
    }
  }
}

// Random event generator
export function maybeGenerateRandomEvent(userId) {
  // 15% chance of a random event per day
  if (Math.random() > 0.15) return null;

  // Deactivate old events
  db.prepare('UPDATE random_events SET active = 0 WHERE user_id = ?').run(userId);

  const events = [
    { type: 'symbiote_surge', title: '🖤 Symbiote Surge', desc: 'Dark energy amplifies your learning! Double XP for all quests today.', mod: 2.0 },
    { type: 'multiverse_rift', title: '🌀 Multiverse Rift', desc: 'A rift opens! +50% XP for exploration quests.', mod: 1.5 },
    { type: 'spider_sense_tingling', title: '🕷️ Spider-Sense Tingling', desc: 'Your senses are heightened! +75% XP today.', mod: 1.75 },
    { type: 'doc_ock_challenge', title: '🐙 Doc Ock Challenge', desc: 'A villain appears! Complete 3 quests for a boss bonus.', mod: 1.25 },
    { type: 'daily_bugle_spotlight', title: '📰 Daily Bugle Spotlight', desc: 'J. Jonah wants a story! +30% XP for creativity quests.', mod: 1.3 },
  ];

  const event = events[Math.floor(Math.random() * events.length)];

  db.prepare(
    'INSERT INTO random_events (user_id, event_type, title, description, xp_modifier) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, event.type, event.title, event.desc, event.mod);

  return event;
}
