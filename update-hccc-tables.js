const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

async function updateEvent() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const eventId = '78a5e4f1-c037-46b0-b70d-1b6888366bb3';
    
    await client.query('UPDATE events SET number_of_tables = 23 WHERE id = $1', [eventId]);
    
    console.log("Updated HCCC Youth Dinner to have 23 tables.");
  } catch (err) {
    console.error("Error updating event:", err);
  } finally {
    await client.end();
  }
}

updateEvent();
