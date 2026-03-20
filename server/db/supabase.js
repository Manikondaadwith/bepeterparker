import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missingEnv = [];
if (!supabaseUrl) missingEnv.push('SUPABASE_URL');
if (!supabaseKey) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');

if (missingEnv.length > 0) {
  console.error(
    `[supabase] Warning: Missing required environment variables: ${missingEnv.join(', ')}. ` +
    `Database operations will fail until these are set in the Vercel Dashboard.`
  );
}

// Ensure the client uses the service role key since the backend is authoritative
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
