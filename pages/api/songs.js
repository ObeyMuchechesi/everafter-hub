import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, songTitle, requestedBy } = req.body || {};
    if (!eventId || !songTitle) {
      return res.status(400).json({ error: 'eventId and songTitle are required' });
    }

    await query('INSERT INTO song_requests (event_id, song_title, requested_by) VALUES ($1, $2, $3)', [eventId, songTitle, requestedBy || 'Guest']);
    return res.json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { songRequestId } = req.body || {};
    if (!songRequestId) {
      return res.status(400).json({ error: 'songRequestId is required' });
    }

    await query('UPDATE song_requests SET votes = COALESCE(votes, 0) + 1 WHERE id = $1', [songRequestId]);
    return res.json({ success: true });
  }

  const { eventId } = req.query;
  const result = await query('SELECT * FROM song_requests WHERE event_id = $1 ORDER BY votes DESC, created_at DESC', [eventId]);
  res.json(result.rows || []);
}