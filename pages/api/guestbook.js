import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { eventId, guestName, message } = req.body;
    await supabase.from('guestbook').insert({ event_id: eventId, guest_name: guestName, message });
    return res.json({ success: true });
  }
  const { eventId } = req.query;
  const { data } = await supabase.from('guestbook').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
  res.json(data || []);
}