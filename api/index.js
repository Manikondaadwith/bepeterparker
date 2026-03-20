// Dynamic import bridge for Vercel
// This ensures compatibility between ESM and CommonJS in Vercel's environment.
export default async function handler(req, res) {
  try {
    // Dynamically import the Express app
    const { default: app } = await import('../server/server.js');
    
    // Hand off the request to Express
    return app(req, res);
  } catch (err) {
    console.error('Vercel Bridge Error:', err);
    res.status(500).json({
      error: 'Vercel Function Invocation Failed',
      message: err.message,
      hint: 'This is usually an ESM/CommonJS mismatch or missing dependencies.'
    });
  }
}
