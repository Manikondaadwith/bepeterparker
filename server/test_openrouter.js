import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/manik/Downloads/sumshitt/server/.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testOpenRouter(model) {
  console.log(`\n--- Testing Model: ${model} ---`);
  console.log("Using API Key:", OPENROUTER_API_KEY ? "Present" : "Missing");
  
  if (!OPENROUTER_API_KEY) {
	console.log("Error: OPENROUTER_API_KEY is not set.");
	return;
  }
  
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
        model: model,
        messages: [
          { role: 'user', content: 'Say hello' }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response Text:", text);
    
    try {
      const data = JSON.parse(text);
      if (data.choices) {
        console.log("Success! Reply:", data.choices[0].message.content);
      } else {
        console.log("Error in response data:", data.error || data);
      }
    } catch (e) {
      console.log("JSON Parse Error:", e.message);
    }

  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function runTests() {
  await testOpenRouter('openrouter/free');
  await testOpenRouter('google/gemini-2.0-flash-lite-preview-02-05:free');
}

runTests();
