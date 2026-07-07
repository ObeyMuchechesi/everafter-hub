const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres.irijfdkwedveecpxwvkv:Tatendajayden1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Check if background_theme exists
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS background_theme TEXT,
      ADD COLUMN IF NOT EXISTS cover_photo TEXT;
    `);
    
    console.log("Schema updated successfully");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
