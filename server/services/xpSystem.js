import { supabase } from '../db/supabase.js';

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
export async function awardXP(userId, baseXP) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (userError || !user) return null;

  // Streak bonus: +5% per streak day, max +50%
  const streakBonus = Math.min(0.5, user.streak * 0.05);

  // Check for active random events
  const { data: activeEvent } = await supabase
    .from('random_events')
    .select('*')
    .eq('user_id', userId)
    .eq('active', 1)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  const eventModifier = activeEvent ? activeEvent.xp_modifier : 1.0;

  const totalXP = Math.floor(baseXP * (1 + streakBonus) * eventModifier);
  const newXP = user.xp + totalXP;

  // Calculate new level
  let newLevel = user.level;
  while (totalXpForLevel(newLevel + 1) <= newXP) {
    newLevel++;
  }

  const leveledUp = newLevel > user.level;

  await supabase
    .from('users')
    .update({ xp: newXP, level: newLevel })
    .eq('id', userId);

  // Check level-based achievements
  await checkLevelAchievements(userId, newLevel);

  return {
    xpGained: totalXP,
    streakBonus: Math.floor(baseXP * streakBonus),
    eventBonus: activeEvent ? activeEvent.title : null,
    newXP,
    newLevel,
    leveledUp
  };
}

async function checkLevelAchievements(userId, level) {
  const milestones = [
    { level: 5, name: 'Friendly Neighborhood', desc: 'Reached Level 5', icon: '🏘️' },
    { level: 10, name: 'Web Warrior', desc: 'Reached Level 10', icon: '⚔️' },
    { level: 20, name: 'Spider Champion', desc: 'Reached Level 20', icon: '🏆' },
    { level: 50, name: 'Multiverse Legend', desc: 'Reached Level 50', icon: '🌌' },
  ];

  for (const m of milestones) {
    if (level >= m.level) {
      // Supabase UNIQUE constraint automatically ignores if it already exists
      await supabase
        .from('achievements')
        .insert([{
          user_id: userId,
          name: m.name,
          description: m.desc,
          icon: m.icon,
          category: 'level'
        }])
        .select()
        .maybeSingle(); // Prevents throwing error intentionally on duplicate
    }
  }
}

// Random event generator
export async function maybeGenerateRandomEvent(userId) {
  // 15% chance of a random event per day
  if (Math.random() > 0.15) return null;

  // Deactivate old events
  await supabase
    .from('random_events')
    .update({ active: 0 })
    .eq('user_id', userId);

  const events = [
    { type: 'symbiote_surge', title: '🖤 Symbiote Surge', desc: 'Dark energy amplifies your learning! Double XP for all quests today.', mod: 2.0 },
    { type: 'multiverse_rift', title: '🌀 Multiverse Rift', desc: 'A rift opens! +50% XP for exploration quests.', mod: 1.5 },
    { type: 'spider_sense_tingling', title: '🕷️ Spider-Sense Tingling', desc: 'Your senses are heightened! +75% XP today.', mod: 1.75 },
    { type: 'doc_ock_challenge', title: '🐙 Doc Ock Challenge', desc: 'A villain appears! Complete 3 quests for a boss bonus.', mod: 1.25 },
    { type: 'daily_bugle_spotlight', title: '📰 Daily Bugle Spotlight', desc: 'J. Jonah wants a story! +30% XP for creativity quests.', mod: 1.3 },
  ];

  const event = events[Math.floor(Math.random() * events.length)];

  await supabase
    .from('random_events')
    .insert([{
      user_id: userId,
      event_type: event.type,
      title: event.title,
      description: event.desc,
      xp_modifier: event.mod
    }]);

  return event;
}
