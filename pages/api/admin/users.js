import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, full_name, company_name, phone, password } = req.body || {};

  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Email, full name, and password are required' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    const result = await query(
      `INSERT INTO users (email, full_name, company_name, phone, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, full_name, company_name || '', phone || '', password, 'user']
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('User creation failed', error);
    return res.status(500).json({ error: 'Unable to create user' });
  }
}
