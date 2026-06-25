import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, imageUrl, caption, uploadedBy } = req.body || {};
    if (!eventId || !imageUrl) {
      return res.status(400).json({ error: 'eventId and imageUrl are required' });
    }

    await query('INSERT INTO photos (event_id, image_url, caption, uploaded_by) VALUES ($1, $2, $3, $4)', [eventId, imageUrl, caption || '', uploadedBy || 'Guest']);
    return res.json({ success: true });
  }

  const { eventId } = req.query;
  const result = await query('SELECT * FROM photos WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
  res.json(result.rows || []);
}
