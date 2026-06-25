const { Pool } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envLocal.match(/DATABASE_URL="(.*)"/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
});

async function test() {
  try {
    console.log('Testing connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Current DB Time:', res.rows[0]);
    
    console.log('Checking tables...');
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', tableRes.rows.map(r => r.table_name).join(', '));
    
  } catch (err) {
    console.error('Connection failed or error occurred:');
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
