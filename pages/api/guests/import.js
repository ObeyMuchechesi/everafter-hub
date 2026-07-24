import { supabase } from '../../../lib/supabase';
import { parseGuestFile } from '../../../lib/guestFileParser';

// Read file as raw binary stream to avoid base64 memory inflation and payload limits
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const eventId = req.query.eventId;
  const fileName = req.query.fileName;

  if (!eventId || !fileName) {
    return res.status(400).json({ error: 'Missing eventId or fileName in query parameters' });
  }

  let buffer;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Could not read the uploaded file stream.' });
  }

  // 1. Parse the file into candidate guests (name + phone). Duplicates are kept.
  let parsedGuests;
  try {
    parsedGuests = await parseGuestFile(buffer, fileName);
  } catch (parseErr) {
    return res.status(400).json({ error: parseErr.message });
  }

  if (!parsedGuests || parsedGuests.length === 0) {
    return res.status(400).json({ error: 'No guest names could be found in this file. Please check the file and try again.' });
  }

  // 2. Look up event seating capacity so we can auto-assign tables, same as the RSVP flow does.
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

  const { data: existingGuests, error: existingError } = await supabase
    .from('guests')
    .select('table_number')
    .eq('event_id', eventId);

  if (existingError) {
    return res.status(500).json({ error: 'Failed to load existing guest list.' });
  }

  const tableCounts = {};
  (existingGuests || []).forEach(g => {
    if (g.table_number) tableCounts[g.table_number] = (tableCounts[g.table_number] || 0) + 1;
  });

  function nextAvailableTable() {
    for (let t = 1; t <= maxTables; t++) {
      if ((tableCounts[t] || 0) < maxChairs) {
        tableCounts[t] = (tableCounts[t] || 0) + 1;
        return t;
      }
    }
    // Every table is at capacity — keep piling onto the last table rather than failing the import.
    const overflowTable = maxTables || 1;
    tableCounts[overflowTable] = (tableCounts[overflowTable] || 0) + 1;
    return overflowTable;
  }

  // 3. Build rows. Every parsed guest is inserted, including exact-duplicate names.
  const rowsToInsert = parsedGuests.map(g => ({
    event_id: eventId,
    first_name: g.firstName.trim(),
    last_name: (g.lastName || '').trim(),
    phone_number: g.phoneNumber ? g.phoneNumber.trim() : null,
    table_number: g.tableNumber || nextAvailableTable(),
    rsvp_status: 'Pending',
  }));

  // 4. Insert in batches so large guest lists don't hit request/row limits.
  const BATCH_SIZE = 200;
  let insertedCount = 0;
  const insertedGuests = [];

  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('guests')
      .insert(batch)
      .select('id, first_name, last_name, phone_number, table_number');

    if (error) {
      console.error('Guest import batch failed', error);
      return res.status(500).json({
        error: `Import failed partway through: ${error.message}`,
        totalParsed: parsedGuests.length,
        insertedCount,
      });
    }
    insertedCount += data.length;
    insertedGuests.push(...data);
  }

  const duplicateNameGroups = {};
  insertedGuests.forEach(g => {
    const key = `${g.first_name.toLowerCase().trim()}|${g.last_name.toLowerCase().trim()}`;
    duplicateNameGroups[key] = (duplicateNameGroups[key] || 0) + 1;
  });
  const duplicateNameCount = Object.values(duplicateNameGroups).filter(count => count > 1).length;

  return res.status(200).json({
    success: true,
    totalParsed: parsedGuests.length,
    insertedCount,
    duplicateNameGroups: duplicateNameCount,
    guests: insertedGuests,
  });
}
