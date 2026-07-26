const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

async function clearGuests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    // Get count first
    const countRes = await client.query('SELECT count(*) FROM guests');
    console.log(`Found ${countRes.rows[0].count} guests in the database. Deleting them all...`);
    
    const res = await client.query('DELETE FROM guests;');
    console.log(`Successfully deleted ${res.rowCount} guests.`);
  } catch (err) {
    console.error("Error clearing guests:", err);
  } finally {
    await client.end();
  }
}

clearGuests();
