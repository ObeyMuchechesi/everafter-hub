import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { slug } = req.query;
  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single();
  if (!event) return res.status(404).json({ error: 'Not found' });

  const { data: guests } = await supabase.from('guests').select('*').eq('event_id', event.id);
  const { data: timeline } = await supabase.from('timeline_items').select('*').eq('event_id', event.id).order('sort_order');
  const { data: menuItems } = await supabase.from('menu_items').select('*').eq('event_id', event.id);
  const { data: photos } = await supabase.from('photos').select('*').eq('event_id', event.id);

  const menu = {};
  if (menuItems) menuItems.forEach(item => { menu[item.course_type] = item.dish_name; });

  res.json({
    id: event.id, eventId: event.id, slug: event.slug,
    couple: event.host_name || 'Guest',
    date: new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    venue: event.venue || '',
    guests: guests?.map(g => ({ name: g.full_name, table: g.table_number, diet: g.dietary_requirements || '' })) || [],
    timeline: timeline?.map(t => ({ time: t.event_time?.slice(0,5), event: t.title, location: t.location || '' })) || [],
    menu: { starter: menu.starter || '', main: menu.main || '', dessert: menu.dessert || '' },
    photos: photos?.map(p => ({ url: p.image_url, caption: p.caption || '' })) || []
  });
}