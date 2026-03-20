import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrations = [
  path.join(__dirname, 'migrations', '001_initial_schema.sql'),
  path.join(__dirname, 'migrations', '002_add_password.sql'),
  path.join(__dirname, 'migrations', '003_create_push_subscriptions.sql')
];

async function runMigrations() {
  // Derive project ref from SUPABASE_URL (e.g. https://abc123.supabase.co → abc123)
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not set. Please configure your .env file.');
    process.exit(1);
  }
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    console.error('❌ SUPABASE_DB_PASSWORD is not set. Add it to your .env file.');
    console.error('   You can find it in Supabase Dashboard → Project Settings → Database.');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.SUPABASE_DB_HOST || `${projectRef}.pooler.supabase.com`,
    port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
    database: 'postgres',
    user: process.env.SUPABASE_DB_USER || `postgres.${projectRef}`,
    password: dbPassword,
  });

  try {
    console.log('🔧 Running database migrations...\n');
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL\n');
    
    for (const migrationPath of migrations) {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      const name = path.basename(migrationPath);
      
      console.log(`📝 Applying: ${name}`);
      try {
        await client.query(sql);
        console.log(`   ✅ ${name}`);
      } catch (err) {
        if (err.code === '42P07' || err.message.includes('already exists')) {
          console.log(`   ✅ ${name} (already exists)`);
        } else {
          console.log(`   ⚠️  ${name} - ${err.message}`);
        }
      }
    }
    
    console.log('\n✨ Migration complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
