import { query } from '../../lib/db';

export default async function handler(req, res) {
  const { slug } = req.query;
  const eventResult = await query('SELECT * FROM events WHERE slug = $1 AND is_active = true LIMIT 1', [slug]);
  const event = eventResult.rows[0];
  if (!event) return res.status(404).json({ error: 'Not found' });

  const guestsResult = await query('SELECT * FROM guests WHERE event_id = $1', [event.id]);
  const timelineResult = await query('SELECT * FROM timeline_items WHERE event_id = $1 ORDER BY sort_order', [event.id]);
  const menuItemsResult = await query('SELECT * FROM menu_items WHERE event_id = $1', [event.id]);
  const photosResult = await query('SELECT * FROM photos WHERE event_id = $1 ORDER BY created_at DESC', [event.id]);

  const menu = {};
  menuItemsResult.rows.forEach(item => { menu[item.course_type] = item.dish_name; });

  res.json({
    id: event.id, eventId: event.id, slug: event.slug,
    couple: event.host_name || 'Guest',
    date: new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    venue: event.venue || '',
    guests: guestsResult.rows.map(g => ({ name: g.full_name, table: g.table_number, diet: g.dietary_requirements || '' })),
    timeline: timelineResult.rows.map(t => ({ time: t.event_time?.slice(0,5), event: t.title, location: t.location || '' })),
    menu: { starter: menu.starter || '', main: menu.main || '', dessert: menu.dessert || '' },
    photos: photosResult.rows.map(p => ({ url: p.image_url, caption: p.caption || '' }))
  });
}