import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, songTitle, requestedBy } = req.body;
    await supabase.from('song_requests').insert({ event_id: eventId, song_title: songTitle, requested_by: requestedBy });
    return res.json({ success: true });
  }
  const { eventId } = req.query;
  const { data } = await supabase.from('song_requests').select('*').eq('event_id', eventId).order('votes', { ascending: false });
  res.json(data || []);
}