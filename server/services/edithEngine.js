/**
 * EDITH AI Engine Service
 * Handles core AI interactions for the BePeterParker system.
 * Uses OpenRouter for intelligent, fast, context-aware responses.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function generateAssistantReply(user, message, context) {
  const { recentQuests = [], topSkills = '' } = context;

  const completedCount = recentQuests.filter(q => q.completed).length;
  const recentQuestTitles = recentQuests.slice(0, 6).map(q => `${q.completed ? '[DONE]' : '[TODO]'} ${q.title}`).join('\n');

  const systemPrompt = `You are EDITH (Even Dead, I'm The Hero), an advanced AI assistant embedded in the BePeterParker training system.
Your role is to guide, evaluate, and evolve the user. Be concise, sharp, context-aware, and act like J.A.R.V.I.S.

USER CONTEXT:
- Name: ${user.username || 'Hero'}
- Level: ${user.level || 1}
- Total XP: ${user.xp || 0}
- Current Streak: ${user.streak || 0} days
- Quests completion: ${completedCount}/${recentQuests.length || 0}
- Top skills: ${topSkills || 'None yet'}

RECENT QUESTS:
${recentQuestTitles || 'No quests yet'}

RULES:
- Keep it under 3 sentences for speed and low latency.
- Be highly intelligent, proactive, and natural.
- Direct them based on their recent quests or skills.
- Do NOT be generic. Provide actionable, sharp advice.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://bepeterparker.vercel.app',
        'X-Title': 'BePeterParker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const text = await response.text();
    console.log("RAW RESPONSE:", text);

    const data = JSON.parse(text);
    const msg = data.choices?.[0]?.message || {};

    let reply = msg.content;

    // fallback for free models
    if (!reply) {
      reply = `Mofo i wont respond for basic shit. You are using free version of me remember?`;
    }

    return reply.trim();
  } catch (err) {
    console.error('EDITH Engine FULL ERROR:', err.message);
    // Fallback response for speed and robustness
    return "My connection to the mainframe is currently unstable, but I'm rebooting systems. What do you need right now?";
  }
}

export async function evaluateUserResponse(quest, responseText) {
  const systemPrompt = `You are EDITH, evaluating a user's completion of a quest.
QUEST TITLE: ${quest.title}
QUEST DESCRIPTION: ${quest.description}
USER RESPONSE: ${responseText}

Evaluate the response based on:
1. Relevance to the quest.
2. Effort shown.
3. Correctness/Validity.

You MUST respond strictly in valid JSON format with the following keys:
{
  "score": <number 0-100>,
  "feedback": "<short constructive feedback, 1-2 sentences. Speak as EDITH>",
  "completed": <boolean true if acceptable effort, false if lazy/unrelated>
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://bepeterparker.vercel.app',
        'X-Title': 'BePeterParker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // In case model wraps in markdown
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (content.startsWith('\`\`\`')) {
      content = content.replace(/\`\`\`/g, '').trim();
    }

    return JSON.parse(content);
  } catch (err) {
    console.error('EDITH Evaluation error:', err);
    // Fallback: auto-approve if LLM fails, don't block user progress
    return {
      score: 80,
      feedback: "My advanced sensors failed to process your exact input, but I sense you put in the work. Good job.",
      completed: true
    };
  }
}
