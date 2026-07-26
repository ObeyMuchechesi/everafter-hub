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
    
    // Grant permissions on event_feedback
    await client.query('GRANT ALL ON TABLE public.event_feedback TO anon, authenticated, service_role;');
    await client.query('GRANT USAGE, SELECT ON SEQUENCE event_feedback_id_seq TO anon, authenticated, service_role;').catch(() => {});
    
    // Check if guests table has RLS
    const rlsRes = await client.query(`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE oid = 'public.guests'::regclass;
    `);
    console.log("Guests RLS:", rlsRes.rows[0]);
    
    // Check if event_feedback has RLS
    const fbRlsRes = await client.query(`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE oid = 'public.event_feedback'::regclass;
    `);
    console.log("Feedback RLS:", fbRlsRes.rows[0]);

    // Let's just create policies to allow anon/authenticated inserts and updates
    // for guests and event_feedback if RLS is enabled.
    
    console.log("Permissions granted!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixDB();
