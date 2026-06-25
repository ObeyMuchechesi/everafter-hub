import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, guestName, message } = req.body;
    await query('INSERT INTO guestbook (event_id, guest_name, message) VALUES ($1, $2, $3)', [eventId, guestName, message]);
    return res.json({ success: true });
  }
  const { eventId } = req.query;
  const result = await query('SELECT * FROM guestbook WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
  res.json(result.rows || []);
}