import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, firstName, lastName, dietaryRequirements } = req.body;

  if (!eventId || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Fetch Event Capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, number_of_tables, chairs_per_table')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const maxTables = event.number_of_tables || 10;
    const maxChairs = event.chairs_per_table || 10;

    // 2. Fetch existing guests to calculate table capacities
    const { data: existingGuests, error: guestsError } = await supabase
      .from('guests')
      .select('table_number')
      .eq('event_id', eventId);

    if (guestsError) {
      return res.status(500).json({ error: 'Failed to fetch existing guests' });
    }

    // 3. Find next available table
    const tableCounts = {};
    for (const g of existingGuests) {
      if (g.table_number) {
        tableCounts[g.table_number] = (tableCounts[g.table_number] || 0) + 1;
      }
    }

    let assignedTable = null;
    for (let t = 1; t <= maxTables; t++) {
      if ((tableCounts[t] || 0) < maxChairs) {
        assignedTable = t;
        break;
      }
    }

    if (assignedTable === null) {
      return res.status(400).json({ error: 'Sorry, the event has reached maximum seating capacity.' });
    }

    // 4. Create the new guest
    const { data: newGuest, error: insertError } = await supabase
      .from('guests')
      .insert({
        event_id: eventId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        dietary_requirements: dietaryRequirements || '',
        table_number: assignedTable,
        rsvp_status: 'attending'
      })
      .select('guest_token')
      .single();

    if (insertError || !newGuest) {
      console.error(insertError);
      return res.status(500).json({ error: 'Failed to record RSVP' });
    }

    res.status(200).json({ success: true, guest_token: newGuest.guest_token });

  } catch (err) {
    console.error('RSVP API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
