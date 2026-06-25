import { query } from './db'

export async function getEventData(slug) {
  const eventResult = await query('SELECT * FROM events WHERE slug = $1 AND is_active = true LIMIT 1', [slug])
  const event = eventResult.rows[0]

  if (!event) return null

  const guestsResult = await query('SELECT * FROM guests WHERE event_id = $1', [event.id])
  const timelineResult = await query('SELECT * FROM timeline_items WHERE event_id = $1 ORDER BY sort_order', [event.id])
  const menuResult = await query('SELECT * FROM menu_items WHERE event_id = $1', [event.id])
  const photosResult = await query('SELECT * FROM photos WHERE event_id = $1 ORDER BY created_at DESC', [event.id])

  const menu = {}
  menuResult.rows.forEach(item => {
    menu[item.course_type] = item.dish_name
  })

  return {
    id: event.id,
    slug: event.slug,
    couple: event.host_name || 'Guest',
    date: new Date(event.event_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    venue: event.venue || '',
    guests: guestsResult.rows.map(g => ({
      name: g.full_name,
      table: g.table_number,
      diet: g.dietary_requirements || ''
    })),
    timeline: timelineResult.rows.map(t => ({
      time: t.event_time?.slice(0, 5),
      event: t.title,
      location: t.location || ''
    })),
    menu: {
      starter: menu.starter || '',
      main: menu.main || '',
      dessert: menu.dessert || ''
    },
    photos: photosResult.rows.map(p => ({
      url: p.image_url,
      caption: p.caption || ''
    })),
    eventId: event.id
  }
}

export async function addGuestbookMessage(eventId, guestName, message) {
  try {
    await query('INSERT INTO guestbook (event_id, guest_name, message) VALUES ($1, $2, $3)', [eventId, guestName, message])
    return true
  } catch (error) {
    console.error('Guestbook insert failed', error)
    return false
  }
}

export async function getGuestbookMessages(eventId) {
  const result = await query('SELECT * FROM guestbook WHERE event_id = $1 ORDER BY created_at DESC', [eventId])
  return result.rows || []
}

export async function addSongRequest(eventId, songTitle, requestedBy) {
  try {
    await query('INSERT INTO song_requests (event_id, song_title, requested_by) VALUES ($1, $2, $3)', [eventId, songTitle, requestedBy])
    return true
  } catch (error) {
    console.error('Song request insert failed', error)
    return false
  }
}

export async function getSongRequests(eventId) {
  const result = await query('SELECT * FROM song_requests WHERE event_id = $1 ORDER BY votes DESC, created_at DESC', [eventId])
  return result.rows || []
}

export async function addPhoto(eventId, imageUrl, caption, uploadedBy) {
  try {
    await query('INSERT INTO photos (event_id, image_url, caption, uploaded_by) VALUES ($1, $2, $3, $4)', [eventId, imageUrl, caption, uploadedBy])
    return true
  } catch (error) {
    console.error('Photo insert failed', error)
    return false
  }
}