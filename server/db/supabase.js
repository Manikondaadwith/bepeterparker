import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Lazy-loads the Supabase client to prevent top-level invocation failures.
 */
export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  console.log('[supabase] Initializing client lazily...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = `[supabase] Missing credentials: ${!supabaseUrl ? 'SUPABASE_URL ' : ''}${!supabaseKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    console.log('[supabase] Client successfully initialized.');
    return supabaseClient;
  } catch (err) {
    console.error('[supabase] Initialization failed:', err.message);
    throw err;
  }
};

// For backward compatibility while transitioning
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    console.warn(`[supabase] Direct access to 'supabase' export is deprecated. Use 'getSupabaseClient()' instead. Accessing: ${prop}`);
    return getSupabaseClient()[prop];
  }
});
