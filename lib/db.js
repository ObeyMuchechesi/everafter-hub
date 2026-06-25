import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('supabase.com') ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function endPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
