console.log('[bridge] Vercel Cold Start: Bridge initialized.');

/**
 * Entry point for Vercel Serverless Function.
 * Wraps the entire invocation in a safety net.
 */
export default async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[bridge:${requestId}] Invocation started: ${req.method} ${req.url}`);

  try {
    console.log(`[bridge:${requestId}] Lazily importing server logic...`);
    const { default: app } = await import('../server/server.js');
    console.log(`[bridge:${requestId}] Server logic imported. Handing off request.`);

    // Hand off the request to Express
    return app(req, res);
  } catch (err) {
    console.error(`[bridge:${requestId}] CRITICAL HANDLER FAILURE:`, err.message);
    console.error(err.stack);

    res.status(500).json({
      error: 'Portal Connection Failed',
      message: 'The Spider-Verse connection was interrupted at the bridge.',
      details: err.message,
      requestId: requestId,
      hint: 'Check Vercel logs for line-by-line trace and ensure all environment variables are set.'
    });
  }
}
