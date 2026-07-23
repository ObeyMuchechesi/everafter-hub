const { Pool } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envLocal.match(/DATABASE_URL="(.*)"/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
});

async function checkSchema() {
  const tables = ['events', 'guests', 'timeline_items', 'menu_items', 'photos', 'guestbook', 'song_requests', 'live_chat_messages'];
  try {
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`\nTable: ${table}`);
      res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSchema();
