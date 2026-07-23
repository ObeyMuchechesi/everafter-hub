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
    const users = await pool.query("SELECT * FROM users WHERE email = 'admin@everafter.com'");
    console.log("Admin User:", users.rows[0]);
    
    if (users.rows.length > 0) {
      const events = await pool.query("SELECT * FROM events WHERE user_id = $1", [users.rows[0].id]);
      console.log("Admin Events:", events.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
