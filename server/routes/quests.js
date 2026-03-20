import { Router } from 'express';
import { getSupabaseClient } from '../db/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateDailyQuests, updateSkill, checkQuestAchievements } from '../services/questGenerator.js';
import { generateLLMQuests, generateChaosQuest, generateBossBattle } from '../services/llmQuestGenerator.js';
import { awardXP, getXpProgress, maybeGenerateRandomEvent } from '../services/xpSystem.js';
import { evaluateUserResponse } from '../services/edithEngine.js';

const router = Router();

// ========== Helper: Store LLM quests into Supabase ==========
async function storeLLMQuests(userId, llmQuests) {
  const today = new Date().toISOString().split('T')[0];
  
  const questInserts = llmQuests.map(q => {
    // Build rich details JSON (same format existing client expects)
    const details = JSON.stringify({
      fullDescription: q.narrative || q.description,
      steps: q.steps || [],
      difficulty: q.difficulty || 'Medium',
      timeEstimate: q.timeEstimate || '15-20 min',
      whyItMatters: q.whyItMatters || '',
      sourceUrl: '',
      thumbnail: '',
      relatedDomains: [q.domain],
      tips: [],
    });

    const fullDescription = q.description + '\n\n' + details;

    return {
      user_id: userId,
      type: q.type,
      title: `${getTypeLabel(q.type)}: ${q.title}`,
      description: fullDescription,
      domain: q.topic || q.domain,
      topic: q.topic || q.title,
      source: q.source || 'llm',
      xp_reward: q.xpReward || q.xp_reward || 30,
      quest_date: today,
    };
  });

  const db = getSupabaseClient();
  console.log(`[quests] Storing ${llmQuests.length} new quests for user ${userId}...`);

  // Insert quests
  const { data: insertedQuests, error: insertError } = await db
    .from('quests')
    .insert(questInserts)
    .select();

  if (insertError) {
    console.error('[quests] Failed to insert quests:', insertError.message);
  }

  // Track topics for anti-repetition
  const topicInserts = llmQuests.map(q => ({
    user_id: userId,
    topic: q.topic || q.title,
    domain: q.domain,
  }));

  const { error: topicError } = await db.from('topic_history').insert(topicInserts);
  if (topicError) {
    console.warn('[quests] Failed to track topics:', topicError.message);
  }

  // Parse inserted quests for client format
  if (insertedQuests) {
    return insertedQuests.map(q => {
      const splitInfo = q.description.split('\n\n{');
      let detailsJson = {};
      if (splitInfo.length > 1) {
        try { detailsJson = JSON.parse('{' + splitInfo.slice(1).join('\n\n{')); } 
        catch { detailsJson = {}; }
      }
      return { ...q, description: splitInfo[0], details: detailsJson };
    });
  }

  return [];
}

function getTypeLabel(type) {
  const labels = {
    spider: '🕷️ Spider Mission',
    side: '🎯 Side Mission',
    exploration: '🔭 Exploration Mission',
    creativity: '🎨 Creativity Mission',
    physical: '💪 Physical Mission',
    chaos: '🌀 Chaos Mission',
  };
  return labels[type] || '🎯 Mission';
}

// ========== GET /api/quests/daily ==========
// Try LLM generation FIRST → fallback to existing static generator
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[quests] Serving daily quests for user ${req.userId}...`);
    const db = getSupabaseClient();
    
    // Check if quests already exist for today
    const { data: existing, error: checkError } = await db
      .from('quests')
      .select('*')
      .eq('user_id', req.userId)
      .eq('quest_date', today);

    if (checkError) {
      console.error('[quests] Check existing quests failed:', checkError.message);
    }

    let quests;

    if (existing && existing.length >= 6) {
      // Already have today's quests — return them
      quests = existing.map(q => {
        const splitInfo = q.description.split('\n\n{');
        let detailsJson = {};
        if (splitInfo.length > 1) {
          try { detailsJson = JSON.parse('{' + splitInfo.slice(1).join('\n\n{')); }
          catch { detailsJson = {}; }
        }
        return { ...q, description: splitInfo[0], details: detailsJson };
      });
    } else {
      // Generate new quests — try LLM first
      try {
        console.log(`[Quests] Attempting LLM quest generation for user ${req.userId}`);
        const llmQuests = await generateLLMQuests(req.userId);
        quests = await storeLLMQuests(req.userId, llmQuests);
        console.log(`[Quests] ✅ LLM generated ${quests.length} quests`);
      } catch (llmErr) {
        console.warn(`[Quests] ⚠️ LLM failed, falling back to static generator:`, llmErr.message);
        // Fallback to existing static quest generator
        quests = await generateDailyQuests(req.userId);
      }
    }

    const randomEvent = await maybeGenerateRandomEvent(req.userId);

    // Get active event
    const { data: activeEvent, error: eventError } = await db
      .from('random_events')
      .select('*')
      .eq('user_id', req.userId)
      .eq('active', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventError) {
      console.warn('[quests] Fetch active event failed:', eventError.message);
    }

    res.json({ quests, randomEvent: activeEvent || randomEvent });
  } catch (err) {
    console.error('Quest generation error:', err);
    res.status(500).json({ error: 'Failed to generate quests' });
  }
});

// ========== GET /api/quests/chaos ==========
// On-demand Chaos Mode quest
router.get('/chaos', authMiddleware, async (req, res) => {
  try {
    const chaosQuest = await generateChaosQuest(req.userId);
    res.json({ quest: chaosQuest });
  } catch (err) {
    console.error('Chaos quest error:', err);
    res.status(500).json({ error: 'Failed to generate chaos quest' });
  }
});

// ========== GET /api/quests/boss-battle ==========
// Boss Battle challenge after completing all daily quests
router.get('/boss-battle', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Verify all daily quests are completed
    const { data: todayQuests } = await supabase
      .from('quests')
      .select('completed')
      .eq('user_id', req.userId)
      .eq('quest_date', today);

    const allDone = todayQuests && todayQuests.length >= 6 && todayQuests.every(q => q.completed);
    
    if (!allDone) {
      return res.status(400).json({ error: 'Complete all daily quests first to unlock the Boss Battle!' });
    }

    const bossBattle = await generateBossBattle(req.userId);
    res.json({ bossBattle });
  } catch (err) {
    console.error('Boss battle error:', err);
    res.status(500).json({ error: 'Failed to generate boss battle' });
  }
});

// ========== POST /api/quests/boss-battle/complete ==========
router.post('/boss-battle/complete', authMiddleware, async (req, res) => {
  try {
    const bonusXP = req.body.bonusXP || 75;
    const xpResult = await awardXP(req.userId, bonusXP);
    
    // Grant boss battle achievement
    await supabase
      .from('achievements')
      .insert([{
        user_id: req.userId,
        name: 'Boss Slayer',
        description: 'Defeated your first Boss Battle',
        icon: '🦑',
        category: 'boss'
      }])
      .select()
      .maybeSingle();

    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, xp, level, streak')
      .eq('id', req.userId)
      .single();

    res.json({ success: true, xpResult, user });
  } catch (err) {
    console.error('Boss battle complete error:', err);
    res.status(500).json({ error: 'Failed to complete boss battle' });
  }
});

// ========== POST /api/quests/evaluate ==========
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    const { questId, responseText } = req.body;
    
    if (!questId || !responseText) {
      return res.status(400).json({ error: 'Quest ID and response text are required' });
    }

    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', req.userId)
      .single();

    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.status(400).json({ error: 'Quest already completed' });

    // Evaluate using EDITH
    const evaluation = await evaluateUserResponse(quest, responseText);

    if (evaluation.completed) {
      // Mark complete
      await supabase
        .from('quests')
        .update({ completed: 1, completed_at: new Date().toISOString() })
        .eq('id', quest.id);

      // Award XP
      const xpResult = await awardXP(req.userId, quest.xp_reward);
      await updateSkill(req.userId, quest.domain);
      await checkQuestAchievements(req.userId);

      const { data: user } = await supabase
        .from('users')
        .select('id, username, email, xp, level, streak')
        .eq('id', req.userId)
        .single();

      const xpProgress = getXpProgress(user);

      // Check boss battle logic
      const today = new Date().toISOString().split('T')[0];
      const { data: todayQuests } = await supabase
        .from('quests')
        .select('completed')
        .eq('user_id', req.userId)
        .eq('quest_date', today);

      const allDone = todayQuests && todayQuests.every(q => q.completed);

      let bossBonus = null;
      if (allDone) {
        const bonusXP = await awardXP(req.userId, 50);
        bossBonus = { message: '🕷️ BOSS BATTLE WON! All daily quests completed!', xp: bonusXP.xpGained };

        await supabase
          .from('achievements')
          .insert([{ user_id: req.userId, name: 'Daily Dominator', description: 'Completed all quests in a single day', icon: '⚡', category: 'daily' }])
          .select()
          .maybeSingle();
      }

      return res.json({
        success: true,
        score: evaluation.score,
        feedback: evaluation.feedback,
        completed: true,
        xpResult,
        xpProgress,
        user,
        bossBonus,
        allQuestsComplete: allDone,
        quest: { ...quest, completed: 1 }
      });
    } else {
      // Evaluation failed, Not completed
      return res.json({
        success: true,
        score: evaluation.score,
        feedback: evaluation.feedback,
        completed: false
      });
    }
  } catch (err) {
    console.error('Quest evaluate error:', err);
    res.status(500).json({ error: 'Failed to evaluate quest' });
  }
});

// ========== POST /api/quests/:id/complete ==========
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.status(400).json({ error: 'Quest already completed' });

    // Mark complete
    await supabase
      .from('quests')
      .update({ completed: 1, completed_at: new Date().toISOString() })
      .eq('id', quest.id);

    // Award XP
    const xpResult = await awardXP(req.userId, quest.xp_reward);

    // Update skill nodes
    await updateSkill(req.userId, quest.domain);

    // Check achievements
    await checkQuestAchievements(req.userId);

    // Get updated user
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, xp, level, streak')
      .eq('id', req.userId)
      .single();

    const xpProgress = getXpProgress(user);

    // Check if all daily quests are done (boss battle opportunity)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayQuests } = await supabase
      .from('quests')
      .select('completed')
      .eq('user_id', req.userId)
      .eq('quest_date', today);

    const allDone = todayQuests && todayQuests.every(q => q.completed);

    let bossBonus = null;
    if (allDone) {
      const bonusXP = await awardXP(req.userId, 50);
      bossBonus = { message: '🕷️ BOSS BATTLE WON! All daily quests completed!', xp: bonusXP.xpGained };

      await supabase
        .from('achievements')
        .insert([{ user_id: req.userId, name: 'Daily Dominator', description: 'Completed all quests in a single day', icon: '⚡', category: 'daily' }])
        .select()
        .maybeSingle();
    }

    res.json({
      success: true,
      xpResult,
      xpProgress,
      user,
      bossBonus,
      allQuestsComplete: allDone,
      quest: { ...quest, completed: 1 }
    });
  } catch (err) {
    console.error('Quest complete error:', err);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// ========== GET /api/quests/history ==========
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    res.json({ quests: quests || [] });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
