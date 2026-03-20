/**
 * EDITH AI Engine Service
 * Even Dead, I'm The Hero — Tactical AI System
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'openrouter/free',
];

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('[EDITH] Missing OPENROUTER_API_KEY environment variable');
}

const BASE_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': 'https://bepeterparker.vercel.app',
  'X-Title': 'BePeterParker',
  'Content-Type': 'application/json',
};

// ─── Shared fetch with timeout + retry ───────────────────────────────────────

async function fetchWithRetry(url, options, retries = 2, timeoutMs = 10_000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 429 && retries > 0) {
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }

    return response;
  } catch (err) {
    if (retries > 0) return fetchWithRetry(url, options, retries - 1, timeoutMs);
    throw err;
  }
}

// ─── Shared OpenRouter call (model waterfall) ─────────────────────────────────

async function callOpenRouter(payload, { tryAllModels = true } = {}) {
  const models = tryAllModels ? MODELS : [MODELS[0]];
  let lastError;

  for (const model of models) {
    try {
      const response = await fetchWithRetry(OPENROUTER_URL, {
        method: 'POST',
        headers: BASE_HEADERS,
        body: JSON.stringify({ ...payload, model }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status} from ${model}`);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error(`Empty response from ${model}`);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[EDITH] Model used: ${model}`);
      }

      return { content: content.trim(), model };
    } catch (err) {
      lastError = err;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[EDITH] ${model} failed:`, err.message);
      }
    }
  }

  throw lastError;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function stripJsonFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(stripJsonFences(text));
  } catch {
    return null;
  }
}

// ─── System prompt builders ───────────────────────────────────────────────────

function buildAssistantSystemPrompt(user, context) {
  const { recentQuests = [], topSkills = '' } = context;
  const completedCount = recentQuests.filter((q) => q.completed).length;

  const questList = recentQuests
    .slice(0, 6)
    .map((q) => `${q.completed ? '[DONE]' : '[TODO]'} ${q.title}`)
    .join('\n') || 'None';

  return `You are EDITH (Even Dead, I'm The Hero), a tactical AI system (JARVIS-style).

USER:
- Name: ${user.username || 'Hero'}
- Level: ${user.level || 1} | XP: ${user.xp || 0} | Streak: ${user.streak || 0}
- Quests: ${completedCount}/${recentQuests.length || 0}
- Skills: ${topSkills || 'None'}

RECENT QUESTS:
${questList}

RULES:
- Precise, actionable, sharp — no generic advice
- Markdown: bullet points, short sections, no long paragraphs
- Keep responses under 120 words unless absolutely necessary`;
}

function buildEvaluationSystemPrompt(quest, responseText) {
  return `Evaluate quest completion.

QUEST: ${quest.title}
DESCRIPTION: ${quest.description}
USER RESPONSE: ${responseText}

Return ONLY valid JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "feedback": "<short, specific feedback>",
  "completed": <true | false>
}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a tactical AI reply for the given user message.
 */
export async function generateAssistantReply(user, message, context) {
  try {
    const { content } = await callOpenRouter({
      messages: [
        { role: 'system', content: buildAssistantSystemPrompt(user, context) },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return content;
  } catch (err) {
    console.error('[EDITH] generateAssistantReply failed:', err.message);
    return 'All AI systems are currently overloaded. Recalibrate and try again.';
  }
}

/**
 * Evaluate a user's quest response and return a structured score.
 */
export async function evaluateUserResponse(quest, responseText) {
  const FALLBACK = {
    score: 80,
    feedback: 'System fallback triggered. Effort detected.',
    completed: true,
  };

  try {
    const { content } = await callOpenRouter(
      {
        messages: [{ role: 'system', content: buildEvaluationSystemPrompt(quest, responseText) }],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      },
      { tryAllModels: false } // evaluation needs the best model only
    );

    const parsed = safeJsonParse(content);
    return parsed || FALLBACK;
  } catch (err) {
    console.error('[EDITH] evaluateUserResponse failed:', err.message);
    return FALLBACK;
  }
}