const { Client } = require('pg');

async function setupDB() {
  const client = new Client({
    connectionString: "postgresql://postgres.irijfdkwedveecpxwvkv:Tatendajayden1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Create live_chat_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_chat_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log("live_chat_messages table created or exists");

    // Recreate the realtime publication safely
    await client.query(`
      BEGIN;
      DROP PUBLICATION IF EXISTS supabase_realtime;
      CREATE PUBLICATION supabase_realtime;
      COMMIT;
    `);

    // Add tables to realtime publication
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE 
        guests, 
        timeline_items, 
        menu_items, 
        guestbook, 
        photos, 
        live_chat_messages;
    `);
    console.log("Realtime publication configured successfully");

  } catch (err) {
    console.error("Error setting up DB:", err);
  } finally {
    await client.end();
  }
}

setupDB();
