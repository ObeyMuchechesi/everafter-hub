const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres.irijfdkwedveecpxwvkv:Tatendajayden1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    await client.query(`
      ALTER TABLE guests
      ADD COLUMN IF NOT EXISTS phone_number TEXT;
    `);
    console.log("Guests table updated successfully with phone_number");

  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
