import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, songTitle, requestedBy } = req.body;
    await query('INSERT INTO song_requests (event_id, song_title, requested_by) VALUES ($1, $2, $3)', [eventId, songTitle, requestedBy]);
    return res.json({ success: true });
  }
  const { eventId } = req.query;
  const result = await query('SELECT * FROM song_requests WHERE event_id = $1 ORDER BY votes DESC, created_at DESC', [eventId]);
  res.json(result.rows || []);
}