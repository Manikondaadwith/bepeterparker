import app from '../server/server.js';

export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Vercel Runtime Error:', err);
    res.status(500).json({
      error: 'Vercel Runtime Error',
      message: err.message,
      hint: 'Check Vercel logs for the full stack trace.'
    });
  }
}
