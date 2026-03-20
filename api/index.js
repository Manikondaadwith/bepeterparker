import app from '../server/server.js';

// Fallback for Vercel in case the main app fails to load or process.env is missing.
const bridgeHandler = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Vercel Bridge Error:', err);
    res.status(500).json({
      error: 'Serverless Function Invocation Failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      hint: 'Check your Vercel environment variables (SUPABASE_URL, etc.)'
    });
  }
};

export default bridgeHandler;
