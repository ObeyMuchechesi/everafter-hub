const { Pool } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envLocal.match(/DATABASE_URL="(.*)"/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
});

async function check() {
  try {
    const res = await pool.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'menu_items'::regclass");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
