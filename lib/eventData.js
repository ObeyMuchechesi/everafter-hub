import { supabase } from './supabase'

export async function getEventData(slug) {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !event) return null

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', event.id)

  const { data: timeline } = await supabase
    .from('timeline_items')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('event_id', event.id)

  const menu = {}
  if (menuItems) {
    menuItems.forEach(item => {
      menu[item.course_type] = item.dish_name
    })
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return {
    id: event.id,
    slug: event.slug,
    couple: event.host_name || 'Guest',
    date: new Date(event.event_date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }),
    venue: event.venue || '',
    guests: guests?.map(g => ({
      name: g.full_name,
      table: g.table_number,
      diet: g.dietary_requirements || ''
    })) || [],
    timeline: timeline?.map(t => ({
      time: t.event_time?.slice(0, 5),
      event: t.title,
      location: t.location || ''
    })) || [],
    menu: {
      starter: menu.starter || '',
      main: menu.main || '',
      dessert: menu.dessert || ''
    },
    photos: photos?.map(p => ({
      url: p.image_url,
      caption: p.caption || ''
    })) || [],
    eventId: event.id
  }
}

export async function addGuestbookMessage(eventId, guestName, message) {
  const { error } = await supabase
    .from('guestbook')
    .insert({ event_id: eventId, guest_name: guestName, message: message })
  return !error
}

export async function getGuestbookMessages(eventId) {
  const { data } = await supabase
    .from('guestbook')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function addSongRequest(eventId, songTitle, requestedBy) {
  const { error } = await supabase
    .from('song_requests')
    .insert({ event_id: eventId, song_title: songTitle, requested_by: requestedBy })
  return !error
}

export async function getSongRequests(eventId) {
  const { data } = await supabase
    .from('song_requests')
    .select('*')
    .eq('event_id', eventId)
    .order('votes', { ascending: false })
  return data || []
}

export async function addPhoto(eventId, imageUrl, caption, uploadedBy) {
  const { error } = await supabase
    .from('photos')
    .insert({ event_id: eventId, image_url: imageUrl, caption: caption, uploaded_by: uploadedBy })
  return !error
}