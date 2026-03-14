import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrations = [
  path.join(__dirname, 'migrations', '001_initial_schema.sql'),
  path.join(__dirname, 'migrations', '002_add_password.sql')
];

async function runMigrations() {
  const projectRef = 'lmkulnjopiyrvnrbdbzn';
  const client = new Client({
    host: `${projectRef}.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: 'postgres.lmkulnjopiyrvnrbdbzn',
    password: 'uB%JAdN+S@gUr5u',
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
