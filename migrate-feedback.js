const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.event_feedback (
        id uuid primary key default gen_random_uuid(),
        event_id uuid references public.events(id) on delete cascade not null,
        feedback text not null,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
      );
    `);
    console.log("Migration complete: created event_feedback table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
