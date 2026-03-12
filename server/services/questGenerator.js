import db from '../db/schema.js';

const DOMAIN_COLORS = [
  '#DC143C', '#1E90FF', '#FFD700', '#00FF7F', '#FF6347',
  '#9370DB', '#FF69B4', '#00CED1', '#FFA500', '#7FFF00',
  '#BA55D3', '#20B2AA', '#FF4500', '#4169E1', '#32CD32'
];

// Dynamically extract domain from topic/source
function extractDomain(topic, source) {
  const domainMap = {
    'arxiv': ['Physics', 'Mathematics', 'Computer Science', 'Biology', 'Chemistry', 'Economics'],
    'wikipedia': ['History', 'Science', 'Geography', 'Philosophy', 'Art', 'Technology', 'Literature'],
    'nasa': ['Astronomy', 'Astrophysics', 'Space Exploration', 'Planetary Science'],
    'hackernews': ['Technology', 'Programming', 'Startups', 'Engineering', 'AI'],
    'reddit': ['Science', 'Research', 'Discovery', 'Innovation'],
    'openlibrary': ['Literature', 'History', 'Philosophy', 'Art', 'Science'],
    'numbers': ['Mathematics', 'History', 'Trivia'],
    'openTrivia': ['General Knowledge', 'Science', 'History', 'Geography'],
  };

  const topicLower = topic.toLowerCase();

  const keywordMap = {
    'quantum': 'Quantum Physics', 'neural': 'Neuroscience', 'galaxy': 'Astrophysics',
    'algorithm': 'Computer Science', 'evolution': 'Biology', 'climate': 'Environmental Science',
    'robot': 'Robotics', 'gene': 'Genetics', 'philosophy': 'Philosophy',
    'music': 'Music Theory', 'architecture': 'Architecture', 'math': 'Mathematics',
    'chemical': 'Chemistry', 'history': 'History', 'psychology': 'Psychology',
    'economic': 'Economics', 'language': 'Linguistics', 'art': 'Visual Arts',
    'ocean': 'Oceanography', 'space': 'Space Science', 'code': 'Programming',
    'machine learning': 'AI & ML', 'crypto': 'Cryptography', 'planet': 'Planetary Science',
    'brain': 'Neuroscience', 'DNA': 'Genetics', 'star': 'Astronomy',
    'fossil': 'Paleontology', 'volcano': 'Geology', 'atom': 'Physics',
    'cell': 'Cell Biology', 'protein': 'Biochemistry', 'light': 'Optics',
    'sound': 'Acoustics', 'electric': 'Electrical Engineering', 'design': 'Design',
    'write': 'Creative Writing', 'cook': 'Culinary Arts', 'photograph': 'Photography',
    'book': 'Literature', 'novel': 'Literature', 'poem': 'Poetry',
    'paint': 'Visual Arts', 'sculpt': 'Sculpture', 'film': 'Cinema',
    'theater': 'Theater', 'dance': 'Dance', 'sport': 'Sports Science',
    'market': 'Marketing', 'business': 'Business', 'invest': 'Finance',
    'medicine': 'Medicine', 'surgery': 'Surgery', 'virus': 'Virology',
    'bacteria': 'Microbiology', 'fungus': 'Mycology', 'plant': 'Botany',
    'insect': 'Entomology', 'bird': 'Ornithology', 'fish': 'Marine Biology',
    'mountain': 'Geography', 'river': 'Hydrology', 'weather': 'Meteorology',
    'earthquake': 'Seismology', 'mineral': 'Mineralogy',
  };

  for (const [keyword, domain] of Object.entries(keywordMap)) {
    if (topicLower.includes(keyword)) return domain;
  }

  const sourceDomains = domainMap[source] || ['General Knowledge'];
  return sourceDomains[Math.floor(Math.random() * sourceDomains.length)];
}

// Difficulty & time estimates based on quest type
function getQuestMeta(questType, topic) {
  const meta = {
    spider: { difficulty: 'Hard', timeEstimate: '45-60 min', icon: '🕷️', steps: [
      `Research the fundamentals of ${topic.title}`,
      `Identify 3 cross-domain connections`,
      `Write a brief synthesis connecting ${topic.title} to another field`,
      `Reflect on how this deepens your understanding`
    ]},
    side: { difficulty: 'Medium', timeEstimate: '15-20 min', icon: '🎯', steps: [
      `Read an overview of ${topic.title}`,
      `Note one surprising fact`,
      `Find one real-world application`
    ]},
    exploration: { difficulty: 'Medium', timeEstimate: '20-30 min', icon: '🔭', steps: [
      `Search for the latest news about ${topic.title}`,
      `Identify a key expert or organization in this field`,
      `Summarize what makes this frontier exciting`
    ]},
    creativity: { difficulty: 'Hard', timeEstimate: '30-45 min', icon: '🎨', steps: [
      `Brainstorm ideas inspired by ${topic.title}`,
      `Choose one idea and create something tangible`,
      `Share or document your creation`
    ]},
    physical: { difficulty: 'Easy', timeEstimate: '25-35 min', icon: '💪', steps: [
      `Begin your physical activity`,
      `While active, listen to or think about ${topic.title}`,
      `Journal your reflections after finishing`
    ]},
  };
  return meta[questType] || meta.side;
}

// ========== TOPIC FETCHERS ==========

async function fetchWikipediaTopics() {
  try {
    const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
    if (!res.ok) return [];
    const data = await res.json();
    return [{
      title: data.title,
      description: data.extract ? data.extract.substring(0, 300) : data.title,
      fullDescription: data.extract || '',
      source: 'wikipedia',
      domain: extractDomain(data.title + ' ' + (data.extract || ''), 'wikipedia'),
      url: data.content_urls?.desktop?.page || '',
      thumbnail: data.thumbnail?.source || '',
    }];
  } catch (e) {
    console.error('Wikipedia fetch error:', e.message);
    return [];
  }
}

async function fetchArxivTopics() {
  try {
    const categories = ['cs.AI', 'cs.LG', 'physics', 'math', 'q-bio', 'astro-ph', 'cond-mat', 'econ', 'cs.CL', 'stat.ML'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const res = await fetch(`http://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`);
    if (!res.ok) return [];
    const text = await res.text();

    const entries = [];
    const titleMatches = text.match(/<title>([\s\S]*?)<\/title>/g) || [];
    const summaryMatches = text.match(/<summary>([\s\S]*?)<\/summary>/g) || [];
    const linkMatches = text.match(/<id>([\s\S]*?)<\/id>/g) || [];

    for (let i = 1; i < Math.min(titleMatches.length, 4); i++) {
      const title = titleMatches[i].replace(/<\/?title>/g, '').trim();
      const summary = summaryMatches[i] ? summaryMatches[i].replace(/<\/?summary>/g, '').trim() : '';
      const link = linkMatches[i] ? linkMatches[i].replace(/<\/?id>/g, '').trim() : '';
      entries.push({
        title,
        description: summary.substring(0, 300),
        fullDescription: summary,
        source: 'arxiv',
        domain: extractDomain(title + ' ' + summary, 'arxiv'),
        url: link,
        thumbnail: '',
      });
    }
    return entries;
  } catch (e) {
    console.error('ArXiv fetch error:', e.message);
    return [];
  }
}

async function fetchNASATopics() {
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=3');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(item => ({
      title: item.title,
      description: (item.explanation || '').substring(0, 300),
      fullDescription: item.explanation || '',
      source: 'nasa',
      domain: extractDomain(item.title + ' ' + (item.explanation || ''), 'nasa'),
      url: item.hdurl || item.url || '',
      thumbnail: item.media_type === 'image' ? item.url : '',
    }));
  } catch (e) {
    console.error('NASA fetch error:', e.message);
    return [];
  }
}

async function fetchHackerNewsTopics() {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!res.ok) return [];
    const ids = await res.json();
    const selected = ids.slice(0, 15).sort(() => Math.random() - 0.5).slice(0, 3);

    const topics = [];
    for (const id of selected) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!storyRes.ok) continue;
        const story = await storyRes.json();
        if (story && story.title) {
          topics.push({
            title: story.title,
            description: story.text ? story.text.replace(/<[^>]*>/g, '').substring(0, 300) : story.title,
            fullDescription: story.text ? story.text.replace(/<[^>]*>/g, '') : `A trending topic on HackerNews: ${story.title}. This was submitted by ${story.by || 'anonymous'} and received ${story.score || 0} points with ${story.descendants || 0} comments.`,
            source: 'hackernews',
            domain: extractDomain(story.title, 'hackernews'),
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            thumbnail: '',
          });
        }
      } catch (e) { continue; }
    }
    return topics;
  } catch (e) {
    console.error('HN fetch error:', e.message);
    return [];
  }
}

async function fetchRedditTopics() {
  try {
    const subs = ['science', 'todayilearned', 'AskScience', 'explainlikeimfive', 'Futurology'];
    const sub = subs[Math.floor(Math.random() * subs.length)];
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=5`, {
      headers: { 'User-Agent': 'SpiderVerseQuestEngine/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || [])
      .filter(c => c.data && c.data.title && !c.data.stickied)
      .slice(0, 3)
      .map(c => ({
        title: c.data.title.substring(0, 150),
        description: (c.data.selftext || c.data.title).substring(0, 300),
        fullDescription: c.data.selftext || c.data.title,
        source: `reddit/${sub}`,
        domain: extractDomain(c.data.title, 'reddit'),
        url: `https://reddit.com${c.data.permalink}`,
        thumbnail: c.data.thumbnail && c.data.thumbnail.startsWith('http') ? c.data.thumbnail : '',
      }));
  } catch (e) {
    console.error('Reddit fetch error:', e.message);
    return [];
  }
}

// Open Library — random classic book topics
async function fetchOpenLibraryTopics() {
  try {
    const subjects = ['science', 'philosophy', 'mathematics', 'art', 'history', 'technology', 'psychology', 'astronomy'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`https://openlibrary.org/subjects/${subject}.json?limit=5`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.works || []).slice(0, 2).map(work => ({
      title: work.title,
      description: `A book about ${subject} by ${work.authors?.map(a => a.name).join(', ') || 'unknown'}.${work.first_publish_year ? ` First published in ${work.first_publish_year}.` : ''}`,
      fullDescription: `"${work.title}" is a work in the field of ${subject}. ${work.authors?.length ? `Written by ${work.authors.map(a => a.name).join(', ')}.` : ''} ${work.first_publish_year ? `First published in ${work.first_publish_year}.` : ''} This book has been borrowed ${work.availability?.available_to_borrow ? 'and is available to borrow' : 'from various libraries'}. Exploring this topic can deepen your understanding of ${subject} and its intersections with other fields.`,
      source: 'openlibrary',
      domain: extractDomain(work.title + ' ' + subject, 'openlibrary'),
      url: `https://openlibrary.org${work.key}`,
      thumbnail: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg` : '',
    }));
  } catch (e) {
    console.error('OpenLibrary fetch error:', e.message);
    return [];
  }
}

// Numbers API — fascinating number facts
async function fetchNumbersTopics() {
  try {
    const types = ['trivia', 'math', 'date', 'year'];
    const type = types[Math.floor(Math.random() * types.length)];
    const num = type === 'date' ? `${Math.ceil(Math.random()*12)}/${Math.ceil(Math.random()*28)}` :
                type === 'year' ? Math.floor(Math.random() * 2000 + 1) :
                Math.floor(Math.random() * 1000);
    const res = await fetch(`http://numbersapi.com/${num}/${type}?json`);
    if (!res.ok) return [];
    const data = await res.json();
    return [{
      title: `The Number ${data.number}: ${type.charAt(0).toUpperCase() + type.slice(1)} Fact`,
      description: data.text || `An interesting fact about the number ${num}`,
      fullDescription: `${data.text}\n\nNumbers hold fascinating secrets across mathematics, history, and science. The number ${data.number} has unique properties that connect to various fields of knowledge.`,
      source: 'numbers',
      domain: extractDomain(data.text || '' + type, 'numbers'),
      url: '',
      thumbnail: '',
    }];
  } catch (e) {
    console.error('Numbers API fetch error:', e.message);
    return [];
  }
}

// Fetch all topics from all sources
export async function fetchAllTopics() {
  const results = await Promise.allSettled([
    fetchWikipediaTopics(),
    fetchWikipediaTopics(),
    fetchWikipediaTopics(),
    fetchArxivTopics(),
    fetchNASATopics(),
    fetchHackerNewsTopics(),
    fetchRedditTopics(),
    fetchOpenLibraryTopics(),
    fetchNumbersTopics(),
  ]);

  const allTopics = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allTopics.push(...result.value);
    }
  }

  // Deduplicate by title
  const seen = new Set();
  return allTopics.filter(t => {
    const key = t.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Anti-repetition: filter out recently used topics
function filterRecentTopics(userId, topics) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentTopics = db.prepare(
    'SELECT topic, domain FROM topic_history WHERE user_id = ? AND used_at > ?'
  ).all(userId, sevenDaysAgo);

  const recentSet = new Set(recentTopics.map(t => t.topic.toLowerCase()));
  const recentDomains = new Map();
  for (const t of recentTopics) {
    recentDomains.set(t.domain, (recentDomains.get(t.domain) || 0) + 1);
  }

  return topics.filter(t => {
    if (recentSet.has(t.title.toLowerCase())) return false;
    if ((recentDomains.get(t.domain) || 0) >= 3) return Math.random() < 0.3;
    return true;
  });
}

// Mutate quest description for topic revisits
function mutateQuest(topic, questType) {
  const mutations = {
    spider: [
      `Deep dive: Research ${topic.title} and discover 3 things that connect it to a completely different field.`,
      `Create a mental map of ${topic.title} — identify its history, key figures, and future implications.`,
      `Investigate ${topic.title} from a contrarian perspective. What do critics say?`,
      `Find the "spider-web" of connections: How does ${topic.title} relate to at least 3 other domains?`,
      `Become an expert: Study ${topic.title} deeply enough to explain it to someone with zero knowledge in the field.`,
    ],
    side: [
      `Quick study: Spend 15 minutes learning about ${topic.title} and summarize in your own words.`,
      `Find a real-world application of ${topic.title} that impacts daily life.`,
      `Watch or read one resource about ${topic.title} and note the most surprising fact.`,
      `Find a YouTube video or article about ${topic.title} and take 3 key notes.`,
    ],
    exploration: [
      `Explore the frontier of ${topic.title}. What's the latest breakthrough or discovery?`,
      `Find an expert or creator working in ${topic.title}. What's their most interesting work?`,
      `Discover how ${topic.title} intersects with art, culture, or philosophy.`,
      `Map out the history of ${topic.title}: How did we get to where we are now?`,
    ],
    creativity: [
      `Create something inspired by ${topic.title}: a sketch, poem, code snippet, or design.`,
      `Imagine you're explaining ${topic.title} to a 10-year-old. Write or record your explanation.`,
      `Design a hypothetical invention or project that uses principles from ${topic.title}.`,
      `Write a short story or analogy that captures the essence of ${topic.title}.`,
    ],
    physical: [
      `Take a 20-min walk while listening to a podcast about ${topic.title}.`,
      `Do a 15-min workout, then spend 10 minutes reading about ${topic.title}.`,
      `Practice a physical skill for 15 minutes, then journal about what ${topic.title} teaches about mastery.`,
      `Go outside, observe nature for 10 minutes, then research how ${topic.title} connects to the natural world.`,
    ]
  };

  const options = mutations[questType] || mutations.side;
  return options[Math.floor(Math.random() * options.length)];
}

// Generate why-it-matters blurb
function whyItMatters(topic) {
  const blurbs = [
    `Understanding ${topic.title} builds bridges between disciplines, a core trait of polymath thinkers.`,
    `This topic reveals hidden patterns that connect to seemingly unrelated fields — exactly the kind of insight that expands your mental model.`,
    `Exploring ${topic.title} challenges assumptions and builds the kind of flexible thinking that defines great innovators.`,
    `Knowledge of ${topic.title} adds a new node to your skill web, creating unexpected connections to your existing expertise.`,
    `This is the kind of topic that sparks curiosity cascades — one insight leads to ten more questions across different domains.`,
  ];
  return blurbs[Math.floor(Math.random() * blurbs.length)];
}

// Generate daily quests for a user
export async function generateDailyQuests(userId) {
  const today = new Date().toISOString().split('T')[0];

  // Check if quests already exist for today
  const existing = db.prepare(
    'SELECT * FROM quests WHERE user_id = ? AND quest_date = ?'
  ).all(userId, today);

  if (existing.length >= 6) return existing;

  // Fetch fresh topics
  let topics = await fetchAllTopics();

  // Apply anti-repetition filter
  topics = filterRecentTopics(userId, topics);

  // If not enough topics after filtering, use fallbacks
  if (topics.length < 6) {
    const fallbacks = [
      { title: 'The Science of Sleep', description: 'Explore how sleep affects learning and memory', fullDescription: 'Sleep is one of the most fundamental biological processes. During sleep, the brain consolidates memories, clears metabolic waste, and reorganizes neural networks.', source: 'wikipedia', domain: 'Neuroscience', url: '', thumbnail: '' },
      { title: 'Fractal Geometry', description: 'Discover the mathematics of self-similar patterns', fullDescription: 'Fractals are infinitely complex patterns that are self-similar across different scales. They are created by repeating a simple process over and over in an ongoing feedback loop.', source: 'wikipedia', domain: 'Mathematics', url: '', thumbnail: '' },
      { title: 'Biomimicry in Engineering', description: 'How nature inspires technology', fullDescription: 'Biomimicry is the design and production of materials, structures, and systems modeled on biological entities and processes. From velcro to bullet trains, nature has inspired countless inventions.', source: 'wikipedia', domain: 'Engineering', url: '', thumbnail: '' },
      { title: 'The History of Cryptography', description: 'From Caesar ciphers to quantum encryption', fullDescription: 'Cryptography has evolved from simple substitution ciphers used by Julius Caesar to the complex mathematical algorithms that protect our digital lives today.', source: 'wikipedia', domain: 'Cryptography', url: '', thumbnail: '' },
      { title: 'Urban Ecology', description: 'How ecosystems thrive in cities', fullDescription: 'Urban ecology studies the interactions of organisms with each other and their environment in urban areas. Cities are evolving ecosystems with unique biodiversity patterns.', source: 'wikipedia', domain: 'Ecology', url: '', thumbnail: '' },
      { title: 'The Psychology of Creativity', description: 'What makes creative minds tick', fullDescription: 'Creativity involves the generation of novel and useful ideas. Research shows it relies on both divergent and convergent thinking across multiple brain networks.', source: 'wikipedia', domain: 'Psychology', url: '', thumbnail: '' },
      { title: 'Fermentation Science', description: 'The chemistry behind bread, beer, and kombucha', fullDescription: 'Fermentation is a metabolic process that produces chemical changes in organic substrates through the action of enzymes. Humans have used fermentation for thousands of years.', source: 'wikipedia', domain: 'Chemistry', url: '', thumbnail: '' },
      { title: 'Musical Mathematics', description: 'The mathematical patterns in music and harmony', fullDescription: 'Music and mathematics are deeply connected. From the Pythagorean scale to Fourier analysis of sound waves, math provides the framework for understanding harmony, rhythm, and acoustics.', source: 'wikipedia', domain: 'Music Theory', url: '', thumbnail: '' },
    ];
    while (topics.length < 8) {
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      if (!topics.find(t => t.title === fb.title)) topics.push(fb);
    }
  }

  // Shuffle
  topics.sort(() => Math.random() - 0.5);

  const user = db.prepare('SELECT level FROM users WHERE id = ?').get(userId);
  const levelMultiplier = 1 + (user?.level || 1) * 0.05;

  const questDefs = [
    { type: 'spider', label: '🕷️ Spider Mission', baseXP: 50 },
    { type: 'side', label: '🎯 Side Mission', baseXP: 25 },
    { type: 'side', label: '🎯 Side Mission', baseXP: 25 },
    { type: 'exploration', label: '🔭 Exploration Mission', baseXP: 30 },
    { type: 'creativity', label: '🎨 Creativity Mission', baseXP: 35 },
    { type: 'physical', label: '💪 Physical Mission', baseXP: 20 },
  ];

  const insertQuest = db.prepare(`
    INSERT INTO quests (user_id, type, title, description, domain, topic, source, xp_reward, quest_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTopic = db.prepare(`
    INSERT INTO topic_history (user_id, topic, domain) VALUES (?, ?, ?)
  `);

  const generatedQuests = [];

  const insertTransaction = db.transaction(() => {
    for (let i = 0; i < questDefs.length; i++) {
      const def = questDefs[i];
      const topic = topics[i % topics.length];
      const xp = Math.floor(def.baseXP * levelMultiplier);
      const description = mutateQuest(topic, def.type);
      const meta = getQuestMeta(def.type, topic);

      // Build rich details JSON
      const details = JSON.stringify({
        fullDescription: topic.fullDescription || topic.description,
        steps: meta.steps,
        difficulty: meta.difficulty,
        timeEstimate: meta.timeEstimate,
        whyItMatters: whyItMatters(topic),
        sourceUrl: topic.url || '',
        thumbnail: topic.thumbnail || '',
        relatedDomains: [topic.domain],
        tips: getTipsForType(def.type),
      });

      const result = insertQuest.run(
        userId, def.type, `${def.label}: ${topic.title}`,
        description + '\n\n' + details,
        topic.domain, topic.title, topic.source, xp, today
      );

      insertTopic.run(userId, topic.title, topic.domain);

      generatedQuests.push({
        id: result.lastInsertRowid,
        type: def.type,
        title: `${def.label}: ${topic.title}`,
        description,
        domain: topic.domain,
        topic: topic.title,
        source: topic.source,
        xp_reward: xp,
        completed: 0,
        quest_date: today,
        details: JSON.parse(details),
      });
    }
  });

  insertTransaction();

  return generatedQuests;
}

function getTipsForType(type) {
  const tips = {
    spider: [
      'Take notes as you research — connections emerge when you write things down.',
      'Try to find at least one unexpected link to a domain you already know.',
      "Don't just skim—aim for understanding you could teach to someone else.",
    ],
    side: [
      'Set a timer for 15 minutes to maintain focus.',
      'Quality over quantity—one deep insight beats ten shallow facts.',
    ],
    exploration: [
      'Follow your curiosity—let one article lead you to the next.',
      'Look for experts on Twitter/X or YouTube who specialize in this.',
    ],
    creativity: [
      "Don't aim for perfection—the goal is to express and connect.",
      'Use any medium: drawing, writing, code, music, photography.',
    ],
    physical: [
      'Combine movement with learning—your brain consolidates info better during light exercise.',
      'Even a short walk counts. The key is the mind-body connection.',
    ],
  };
  return tips[type] || tips.side;
}

// Create or update skill based on completed quest
export function updateSkill(userId, domain) {
  const existing = db.prepare(
    'SELECT * FROM skills WHERE user_id = ? AND name = ?'
  ).get(userId, domain);

  const color = DOMAIN_COLORS[Math.floor(Math.random() * DOMAIN_COLORS.length)];

  if (existing) {
    db.prepare(
      'UPDATE skills SET xp = xp + 10, quest_count = quest_count + 1 WHERE id = ?'
    ).run(existing.id);
  } else {
    db.prepare(
      'INSERT INTO skills (user_id, name, domain, xp, quest_count, color) VALUES (?, ?, ?, 10, 1, ?)'
    ).run(userId, domain, domain, color);
  }
}

// Check and grant quest-based achievements
export function checkQuestAchievements(userId) {
  const totalCompleted = db.prepare(
    'SELECT COUNT(*) as count FROM quests WHERE user_id = ? AND completed = 1'
  ).get(userId).count;

  const skillCount = db.prepare(
    'SELECT COUNT(*) as count FROM skills WHERE user_id = ?'
  ).get(userId).count;

  const achievements = [
    { condition: totalCompleted >= 1, name: 'First Web', desc: 'Completed your first quest', icon: '🕸️', cat: 'quest' },
    { condition: totalCompleted >= 10, name: 'Quest Apprentice', desc: 'Completed 10 quests', icon: '📜', cat: 'quest' },
    { condition: totalCompleted >= 50, name: 'Quest Master', desc: 'Completed 50 quests', icon: '🎓', cat: 'quest' },
    { condition: totalCompleted >= 100, name: 'Quest Legend', desc: 'Completed 100 quests', icon: '👑', cat: 'quest' },
    { condition: skillCount >= 3, name: 'Triple Threat', desc: 'Discovered 3 skill domains', icon: '🔱', cat: 'skill' },
    { condition: skillCount >= 5, name: 'Polymath Rising', desc: 'Discovered 5 skill domains', icon: '🧠', cat: 'skill' },
    { condition: skillCount >= 10, name: 'Renaissance Spider', desc: 'Discovered 10 skill domains', icon: '🎭', cat: 'skill' },
    { condition: skillCount >= 20, name: 'Multiverse Mind', desc: 'Discovered 20 skill domains', icon: '🌌', cat: 'skill' },
  ];

  for (const a of achievements) {
    if (a.condition) {
      try {
        db.prepare(
          'INSERT OR IGNORE INTO achievements (user_id, name, description, icon, category) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, a.name, a.desc, a.icon, a.cat);
      } catch (e) { /* ignore */ }
    }
  }
}
