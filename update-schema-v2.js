const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres.irijfdkwedveecpxwvkv:Tatendajayden1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    await client.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS number_of_tables INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS chairs_per_table INTEGER DEFAULT 10;
    `);
    console.log("Events table updated successfully");

    await client.query(`
      ALTER TABLE guests
      ADD COLUMN IF NOT EXISTS is_reserved BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT gen_random_uuid();
    `);
    console.log("Guests table updated successfully");

  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
