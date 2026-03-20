import { supabase } from '../db/supabase.js';

// ========== OpenRouter LLM Integration ==========

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LLM_MODEL = 'deepseek/deepseek-chat:free'; // Free tier model

// In-memory cache: { [userId_date]: { quests, timestamp } }
const questCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Domain categories for quest variety
const QUEST_DOMAINS = ['learning', 'creativity', 'physical', 'thinking', 'exploration'];

const QUEST_TYPES = [
  { type: 'spider', label: '🕷️ Spider Mission', baseXP: 50, domain: 'thinking' },
  { type: 'side', label: '🎯 Side Mission', baseXP: 25, domain: 'learning' },
  { type: 'side', label: '🎯 Side Mission', baseXP: 25, domain: 'learning' },
  { type: 'exploration', label: '🔭 Exploration Mission', baseXP: 30, domain: 'exploration' },
  { type: 'creativity', label: '🎨 Creativity Mission', baseXP: 35, domain: 'creativity' },
  { type: 'physical', label: '💪 Physical Mission', baseXP: 20, domain: 'physical' },
];

/**
 * Build the LLM prompt that generates quests tailored to user profile.
 */
function buildQuestPrompt(userProfile, recentHistory, weakDomains, includeChaos) {
  const level = userProfile.level || 1;
  const difficulty = level <= 3 ? 'beginner-friendly' : level <= 10 ? 'intermediate' : level <= 25 ? 'advanced' : 'expert-level';
  
  const recentTopics = recentHistory.map(h => h.topic).join(', ');
  const weakDomainStr = weakDomains.length > 0 
    ? `The user is weakest in: ${weakDomains.join(', ')}. Prioritize quests in these areas.`
    : 'Balance quests across all domains.';

  const chaosInstruction = includeChaos
    ? `\nFor quest #6, make it a WILD CARD "Chaos Quest" — something completely unexpected, fun, and out-of-the-box. It should surprise the user. Give it the type "chaos" and make it memorable.`
    : '';

  return `You are the Spider-Verse Quest Engine AI — an AI-powered Spider-Man training system that generates daily personal growth quests.

Generate exactly 6 unique quests for a user. Each quest must feel like a Spider-Man mission briefing — engaging, narrative-driven, and actionable.

USER PROFILE:
- Level: ${level} (${difficulty} difficulty)
- Streak: ${userProfile.streak || 0} days
- Quest experience: ${difficulty}

AVOID THESE RECENTLY USED TOPICS (do NOT repeat): ${recentTopics || 'none'}

${weakDomainStr}

QUEST FORMAT (return as JSON array):
Each quest must have these exact fields:
1. "title" - A compelling, specific title (NOT generic)
2. "narrative" - 2-3 sentences in Spider-Man voice explaining the mission
3. "description" - Clear, actionable task description  
4. "steps" - Array of 3-4 specific step-by-step instructions
5. "timeEstimate" - Realistic time estimate (e.g., "20-30 min")
6. "xpReward" - XP value between ${Math.floor(20 * (1 + level * 0.05))} and ${Math.floor(60 * (1 + level * 0.05))}
7. "domain" - One of: learning, creativity, physical, thinking, exploration
8. "type" - One of: spider, side, exploration, creativity, physical
9. "whyItMatters" - One sentence on why this quest is valuable for personal growth
10. "difficulty" - One of: Easy, Medium, Hard
11. "topic" - The core subject/topic of the quest

QUEST REQUIREMENTS:
- Quest 1: A deep "Spider Mission" (thinking/research) — Hard difficulty
- Quest 2: A practical "Side Mission" (learning something new) — Medium difficulty  
- Quest 3: Another "Side Mission" (different topic) — Easy/Medium difficulty
- Quest 4: An "Exploration Mission" (discover something in the real world or online frontier)
- Quest 5: A "Creativity Mission" (create, draw, write, design, or build something)
- Quest 6: A "Physical Mission" (involves movement, exercise, or outdoor activity)${chaosInstruction}

IMPORTANT RULES:
- NO generic "read an article" tasks. Make quests ACTIONABLE and SPECIFIC.
- Include creative tasks: draw, write, explain to someone, build a prototype
- Include physical actions: walk, exercise, observe nature, visit a place
- Include thinking challenges: solve, analyze, debate, compare perspectives
- Make every quest feel like Spider-Man would assign it
- Vary topics across science, art, philosophy, technology, nature, culture, history
- Each quest MUST be substantially different from the others

Return ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the JSON array.`;
}

/**
 * Call OpenRouter API to generate quests via LLM, fallback to free Pollinations API if no key.
 */
async function callLLM(prompt, systemPrompt = 'You are a quest generation AI. You ONLY return valid JSON arrays. Never include markdown, code fences, or explanations.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Free Keyless Fallback Route
  if (!apiKey || apiKey.trim() === '') {
    console.log('[LLM] Using free keyless pollinations.ai API...');
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        seed: Math.floor(Math.random() * 10000)
      })
    });
    
    if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
    }
    return await response.text();
  }

  // Premium OpenRouter Route
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://bepeterparker.onrender.com',
      'X-Title': 'Spider-Verse Quest Engine',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 3000,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return content;
}

/**
 * Parse LLM response into quest objects, with validation.
 */
function parseLLMResponse(raw) {
  // Strip any markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const quests = JSON.parse(cleaned);

  if (!Array.isArray(quests) || quests.length < 6) {
    throw new Error(`Expected 6 quests, got ${Array.isArray(quests) ? quests.length : 'non-array'}`);
  }

  // Validate and normalize each quest
  return quests.slice(0, 6).map((q, i) => {
    const type = QUEST_TYPES[i];
    return {
      title: q.title || `Quest ${i + 1}`,
      narrative: q.narrative || '',
      description: q.description || q.narrative || '',
      steps: Array.isArray(q.steps) ? q.steps.slice(0, 4) : ['Explore this topic', 'Take notes', 'Reflect on what you learned'],
      timeEstimate: q.timeEstimate || '15-20 min',
      xpReward: typeof q.xpReward === 'number' ? q.xpReward : type.baseXP,
      domain: QUEST_DOMAINS.includes(q.domain) ? q.domain : type.domain,
      type: q.type || type.type,
      whyItMatters: q.whyItMatters || 'Every quest makes you stronger.',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
      topic: q.topic || q.title,
      source: 'llm',
    };
  });
}

/**
 * Get user's weakest skill domains to prioritize in quests.
 */
async function getWeakDomains(userId) {
  const { data: skills } = await supabase
    .from('skills')
    .select('domain, xp')
    .eq('user_id', userId)
    .order('xp', { ascending: true });

  if (!skills || skills.length === 0) return [];

  // Map skill domains to quest domains
  const domainMapping = {
    'Computer Science': 'learning', 'Physics': 'thinking', 'Mathematics': 'thinking',
    'Biology': 'learning', 'Chemistry': 'learning', 'History': 'learning',
    'Philosophy': 'thinking', 'Art': 'creativity', 'Visual Arts': 'creativity',
    'Creative Writing': 'creativity', 'Music Theory': 'creativity',
    'Sports Science': 'physical', 'Geography': 'exploration',
    'Astronomy': 'exploration', 'Space Science': 'exploration',
  };

  const domainXP = {};
  for (const d of QUEST_DOMAINS) domainXP[d] = 0;
  
  for (const skill of skills) {
    const mapped = domainMapping[skill.domain] || 'learning';
    domainXP[mapped] += skill.xp;
  }

  // Return bottom 2 weakest domains
  return Object.entries(domainXP)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([domain]) => domain);
}

/**
 * Get recent quest history for anti-repetition.
 */
async function getRecentHistory(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  
  const { data: history } = await supabase
    .from('topic_history')
    .select('topic, domain')
    .eq('user_id', userId)
    .gt('used_at', sevenDaysAgo);

  return history || [];
}

/**
 * Main function: Generate quests using LLM with personalization.
 * Falls back gracefully if LLM fails.
 */
export async function generateLLMQuests(userId, options = {}) {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${userId}_${today}`;
  const includeChaos = options.chaosMode || Math.random() < 0.15; // 15% chance of chaos quest

  // Check cache first
  const cached = questCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[LLM] Returning cached quests for ${userId}`);
    return cached.quests;
  }

  // Gather user context
  const { data: userProfile } = await supabase
    .from('users')
    .select('level, streak, xp')
    .eq('id', userId)
    .single();

  if (!userProfile) throw new Error('User not found');

  const [recentHistory, weakDomains] = await Promise.all([
    getRecentHistory(userId),
    getWeakDomains(userId),
  ]);

  // Build prompt and call LLM
  const prompt = buildQuestPrompt(userProfile, recentHistory, weakDomains, includeChaos);
  const rawResponse = await callLLM(prompt);
  const quests = parseLLMResponse(rawResponse);

  // Apply level-based XP scaling
  const levelMultiplier = 1 + (userProfile.level || 1) * 0.05;
  for (const quest of quests) {
    quest.xpReward = Math.floor(quest.xpReward * levelMultiplier);
  }

  // Inject a "surprise quest" occasionally (separate from chaos mode)
  if (Math.random() < 0.1 && !includeChaos) {
    const surpriseQuest = generateSurpriseQuest(userProfile.level || 1, levelMultiplier);
    quests[Math.floor(Math.random() * 6)] = surpriseQuest;
  }

  // Cache the result
  questCache.set(cacheKey, { quests, timestamp: Date.now() });

  return quests;
}

/**
 * Generate a Chaos Mode quest (on-demand surprise quest).
 */
export async function generateChaosQuest(userId) {
  const { data: userProfile } = await supabase
    .from('users')
    .select('level, streak')
    .eq('id', userId)
    .single();

  const level = userProfile?.level || 1;
  const levelMultiplier = 1 + level * 0.05;

  try {
    const prompt = `Generate exactly ONE wild, unpredictable, out-of-the-box "Chaos Quest" for a level ${level} user.
    It should be fun, surprising, and slightly mischievous like Spider-Man.
    Return ONLY a JSON object (NOT an array) with exactly these fields:
    - title (string)
    - narrative (string: 2 sentences max)
    - description (string)
    - steps (array of 3-4 strings)
    - timeEstimate (string, e.g. "20 min")
    - xpReward (number exactly ${Math.floor(40 * levelMultiplier)})
    - domain (string: thinking, creativity, physical, learning, exploration)
    - type (must be "chaos")
    - topic (string)
    - whyItMatters (string)`;
    
    const rawResponse = await callLLM(prompt, 'You return valid JSON objects only. No markdown fences.');
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    const quest = JSON.parse(cleaned);
    quest.source = 'chaos-llm';
    if (!quest.type) quest.type = 'chaos';
    return quest;
  } catch (err) {
    console.warn('[LLM] Chaos Quest LLM generation failed, falling back to static:', err.message);
    const chaosQuests = [
      {
        title: 'Web of Shadows: Mirror Challenge',
        narrative: "Your spider-sense is going haywire! Something in the multiverse wants you to face yourself.",
        description: 'Write down 3 things you believe about yourself, then argue the opposite perspective for each one.',
        steps: ['Write 3 beliefs you hold strongly', 'For each belief, write the strongest counter-argument', 'Reflect: did any counter-argument surprise you?'],
        timeEstimate: '25-35 min', domain: 'thinking', type: 'chaos', difficulty: 'Hard',
        topic: 'Self-Reflection', whyItMatters: 'The greatest heroes question their own assumptions.', source: 'chaos',
      },
      {
        title: 'Venom\'s Art Attack',
        narrative: "Venom has infected the art world! Only you can restore creativity to the multiverse.",
        description: 'Create a piece of art using ONLY your non-dominant hand. The constraint forces creative breakthroughs.',
        steps: ['Gather art materials', 'Set a 15-minute timer', 'Create something using only your non-dominant hand'],
        timeEstimate: '20-30 min', domain: 'creativity', type: 'chaos', difficulty: 'Medium',
        topic: 'Creative Constraints', whyItMatters: 'Constraints breed innovation.', source: 'chaos',
      }
    ];

    const quest = chaosQuests[Math.floor(Math.random() * chaosQuests.length)];
    quest.xpReward = Math.floor(40 * levelMultiplier);
    return quest;
  }
}

/**
 * Generate Boss Battle challenge after completing all daily quests.
 */
export async function generateBossBattle(userId) {
  const { data: userProfile } = await supabase
    .from('users')
    .select('level, xp')
    .eq('id', userId)
    .single();

  const level = userProfile?.level || 1;
  const levelMultiplier = 1 + level * 0.05;

  try {
    const prompt = `Generate exactly ONE extreme "Boss Battle" ultimate challenge quest for a level ${level} user.
    The narrative should involve defeating a Spider-Man villain (like Doc Ock, Green Goblin, Electro, Sandman).
    The challenge involves synthesizing knowledge, intense rapid learning, or a burst of intense creative/physical output.
    Return ONLY a JSON object (NOT an array) with exactly these fields:
    - title (string, e.g., "🦑 Doctor Octopus: Integration Challenge")
    - narrative (string: 2 sentences max)
    - description (string)
    - steps (array of 3-4 intense action strings)
    - timeEstimate (string, e.g. "15-25 min")
    - bonusXP (number exactly ${Math.floor(75 * levelMultiplier)})
    - difficulty (must be "Hard")`;
    
    const rawResponse = await callLLM(prompt, 'You return valid JSON objects only. No markdown fences.');
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    const battle = JSON.parse(cleaned);
    return battle;
  } catch (err) {
    console.warn('[LLM] Boss Battle LLM generation failed, falling back to static:', err.message);
    const bossBattles = [
      {
        title: '🦑 Doctor Octopus: The Integration Challenge',
        narrative: "Doc Ock has merged his tentacles with today's knowledge streams! Defeat him by connecting ALL of today's quest topics into one unified insight.",
        description: 'Review all 6 quests you completed today. Write a short paragraph (or draw a diagram) showing how they connect to each other.',
        steps: ['Review your completed quests', 'Find at least 2 connections between different quest topics', 'Write or sketch a unifying theme'],
        timeEstimate: '15-25 min',
        bonusXP: Math.floor(75 * levelMultiplier),
        difficulty: 'Hard',
      },
      {
        title: '🟢 The Green Goblin: Speed Round',
        narrative: "The Goblin is bombing the city! You have 10 minutes to summarize EVERYTHING you learned today in a rapid-fire knowledge dump.",
        description: 'Set a 10-minute timer. Write down as many things as you can remember from today\'s quests — facts, insights, ideas, questions.',
        steps: ['Set a 10-minute timer', 'Write non-stop about everything you learned', 'Don\'t edit — just dump your knowledge'],
        timeEstimate: '10-15 min',
        bonusXP: Math.floor(60 * levelMultiplier),
        difficulty: 'Medium',
      }
    ];

    return bossBattles[Math.floor(Math.random() * bossBattles.length)];
  }
}

/**
 * Generate a random surprise quest injected into daily quests.
 */
function generateSurpriseQuest(level, multiplier) {
  const surprises = [
    {
      title: 'Spider-Sense: Random Act of Knowledge',
      narrative: "Your spider-sense detected someone nearby who could use a boost! Share something you learned this week with someone.",
      description: 'Share one interesting fact or insight from your recent quests with a friend, family member, or online.',
      steps: ['Pick your favorite learning from this week', 'Share it with someone in conversation or a message', 'Ask them what they thought about it'],
      timeEstimate: '10-15 min', domain: 'learning', type: 'side', difficulty: 'Easy',
      topic: 'Knowledge Sharing', whyItMatters: 'Knowledge multiplies when shared.', source: 'surprise',
    },
    {
      title: 'The Watcher\'s Assignment: Silent Observation',
      narrative: "The Watcher sees all. For 10 minutes, observe the world around you with complete focus.",
      description: 'Spend 10 minutes in total silence, observing your environment. No phone, no distractions. Then write what you noticed.',
      steps: ['Find a comfortable spot', 'Set a 10-minute silent timer', 'Observe everything: sounds, sights, feelings', 'Write 5 observations afterward'],
      timeEstimate: '15-20 min', domain: 'exploration', type: 'exploration', difficulty: 'Easy',
      topic: 'Mindfulness', whyItMatters: 'Spider-Man\'s greatest power is awareness.', source: 'surprise',
    },
  ];

  const quest = surprises[Math.floor(Math.random() * surprises.length)];
  quest.xpReward = Math.floor(30 * multiplier);
  return quest;
}

/**
 * Clear expired entries from the quest cache.
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of questCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      questCache.delete(key);
    }
  }
}

// Clean cache every hour
setInterval(clearExpiredCache, 60 * 60 * 1000);
