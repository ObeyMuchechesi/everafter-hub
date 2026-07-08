import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, adminId, eventId } = req.body;

  const client = new Client({
    connectionString: "postgresql://postgres.irijfdkwedveecpxwvkv:Tatendajayden1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();

    if (action === 'deleteeverything') {
      await client.query("DELETE FROM guests;");
      await client.query("DELETE FROM timeline_items;");
      await client.query("DELETE FROM menu_items;");
      await client.query("DELETE FROM photos;");
      await client.query("DELETE FROM guestbook;");
      await client.query("DELETE FROM live_chat_messages;");
      await client.query("DELETE FROM events;");
      if (adminId) {
        await client.query("DELETE FROM users WHERE id != $1;", [adminId]);
      } else {
        await client.query("DELETE FROM users WHERE role != 'admin';");
      }
      res.status(200).json({ success: true, message: 'All data wiped successfully' });

    } else if (action === 'deleteevents') {
      await client.query("DELETE FROM events;");
      res.status(200).json({ success: true, message: 'All events deleted' });

    } else if (action === 'deleteusers') {
      if (adminId) {
        await client.query("DELETE FROM users WHERE id != $1;", [adminId]);
      } else {
        await client.query("DELETE FROM users WHERE role != 'admin';");
      }
      res.status(200).json({ success: true, message: 'Users deleted' });

    } else if (action === 'deleteguests') {
      if (eventId && eventId !== 'all') {
        await client.query("DELETE FROM guests WHERE event_id = $1;", [eventId]);
      } else {
        await client.query("DELETE FROM guests;");
      }
      res.status(200).json({ success: true, message: 'Guests deleted' });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Danger Zone Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
}
