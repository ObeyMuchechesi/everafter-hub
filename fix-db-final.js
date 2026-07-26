const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

async function fixDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // 1. Grants
    await client.query('GRANT ALL ON TABLE public.event_feedback TO anon, authenticated, service_role;');
    await client.query('GRANT ALL ON TABLE public.guests TO anon, authenticated, service_role;');
    await client.query('GRANT USAGE, SELECT ON SEQUENCE event_feedback_id_seq TO anon, authenticated, service_role;').catch(() => {});
    
    // 2. Disable RLS
    await client.query('ALTER TABLE public.event_feedback DISABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY;');

    // 3. Enable Realtime
    try {
      await client.query("ALTER PUBLICATION supabase_realtime ADD TABLE guests;");
    } catch (e) {
      console.log("Guests might already be in publication or publication doesn't exist");
    }
    
    try {
      await client.query("ALTER PUBLICATION supabase_realtime ADD TABLE event_feedback;");
    } catch (e) {
      console.log("event_feedback might already be in publication or publication doesn't exist");
    }

    console.log("Database fixes applied successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixDB();
