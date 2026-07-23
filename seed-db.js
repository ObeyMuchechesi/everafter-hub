const { Pool } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envLocal.match(/DATABASE_URL="(.*)"/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
});

async function seed() {
  try {
    console.log("Starting DB seed...");
    // 1. Get admin user
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'admin@everafter.com'");
    if (userRes.rows.length === 0) {
      console.error("Admin user not found!");
      return;
    }
    const adminId = userRes.rows[0].id;
    console.log("Admin ID:", adminId);

    // Clean up previous dummy events for this admin
    const prevEvents = await pool.query("SELECT id FROM events WHERE user_id = $1", [adminId]);
    for (let row of prevEvents.rows) {
      await pool.query("DELETE FROM guests WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM timeline_items WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM menu_items WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM photos WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM guestbook WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM song_requests WHERE event_id = $1", [row.id]);
      await pool.query("DELETE FROM live_chat_messages WHERE event_id = $1", [row.id]);
    }
    await pool.query("DELETE FROM events WHERE user_id = $1", [adminId]);
    console.log("Cleaned up previous events.");

    // 2. Insert Event
    const eventInsert = await pool.query(`
      INSERT INTO events (
        id, user_id, event_type, event_name, host_name, event_date, venue, slug, guest_access_url, qr_code_value, is_active, background_theme, cover_photo, number_of_tables, chairs_per_table, is_deleted
      ) VALUES (
        gen_random_uuid(), $1, 'Wedding', 'The Royal Wedding', 'Admin User', CURRENT_DATE + INTERVAL '30 days', 'The Grand Palace', 'royal-wedding', 'https://everafter.com/royal-wedding', 'royal-wedding-qr', true, '#ffffff', 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80', 10, 8, false
      ) RETURNING id
    `, [adminId]);
    const eventId = eventInsert.rows[0].id;
    console.log("Event created:", eventId);

    // 3. Insert Timeline Items
    await pool.query(`
      INSERT INTO timeline_items (id, event_id, event_time, title, location, sort_order) VALUES
      (gen_random_uuid(), $1, '14:00', 'Guest Arrival', 'Main Hall', 1),
      (gen_random_uuid(), $1, '15:00', 'Ceremony', 'Garden', 2),
      (gen_random_uuid(), $1, '16:30', 'Cocktail Hour', 'Patio', 3),
      (gen_random_uuid(), $1, '18:00', 'Dinner', 'Banquet Hall', 4),
      (gen_random_uuid(), $1, '20:00', 'Dancing & Music', 'Main Hall', 5)
    `, [eventId]);
    console.log("Timeline items inserted.");

    // 4. Insert Menu Items
    await pool.query(`
      INSERT INTO menu_items (id, event_id, course_type, dish_name, description) VALUES
      (gen_random_uuid(), $1, 'starter', 'Truffle Mushroom Soup', 'Creamy woodland mushroom soup with truffle oil.'),
      (gen_random_uuid(), $1, 'main', 'Herb-Crusted Salmon', 'Served with asparagus and lemon butter sauce.'),
      (gen_random_uuid(), $1, 'main', 'Beef Wellington', 'Classic beef wellington with a rich red wine reduction.'),
      (gen_random_uuid(), $1, 'dessert', 'Vanilla Bean Panna Cotta', 'Served with fresh seasonal berries.')
    `, [eventId]);
    console.log("Menu items inserted.");

    // 5. Insert Photos
    await pool.query(`
      INSERT INTO photos (id, event_id, image_url, caption, uploaded_by, is_approved) VALUES
      (gen_random_uuid(), $1, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', 'Beautiful setup!', 'Alice', true),
      (gen_random_uuid(), $1, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80', 'The happy couple.', 'Bob', true),
      (gen_random_uuid(), $1, 'https://images.unsplash.com/photo-1532712938736-59c79cfe0706?auto=format&fit=crop&w=600&q=80', 'Table decorations.', 'Charlie', true),
      (gen_random_uuid(), $1, 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80', 'Cheers to the newly weds!', 'Diana', false)
    `, [eventId]);
    console.log("Photos inserted.");

    // 6. Insert Guests
    const guestNames = [
      ['John', 'Doe'], ['Jane', 'Smith'], ['Michael', 'Johnson'], ['Emily', 'Williams'],
      ['Chris', 'Brown'], ['Sarah', 'Jones'], ['David', 'Garcia'], ['Laura', 'Martinez'],
      ['James', 'Rodriguez'], ['Jessica', 'Hernandez'], ['Matthew', 'Lopez'], ['Ashley', 'Gonzalez'],
      ['Joshua', 'Wilson'], ['Amanda', 'Anderson'], ['Andrew', 'Thomas'], ['Melissa', 'Taylor']
    ];

    const guestIds = [];
    for (let i = 0; i < guestNames.length; i++) {
      const g = guestNames[i];
      const tableNo = (i % 10) + 1; // 1 to 10
      const rsvp = i % 3 === 0 ? 'Pending' : (i % 5 === 0 ? 'Declined' : 'Attending');
      const gRes = await pool.query(`
        INSERT INTO guests (id, event_id, first_name, last_name, table_number, rsvp_status, dietary_requirements, is_reserved, phone_number)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [eventId, g[0], g[1], tableNo, rsvp, i % 4 === 0 ? 'Vegan' : (i % 7 === 0 ? 'Gluten-Free' : 'None'), true, '+1555000' + (1000 + i)]);
      guestIds.push(gRes.rows[0].id);
    }
    console.log("Guests inserted.");

    // 7. Insert Guestbook messages
    await pool.query(`
      INSERT INTO guestbook (id, event_id, guest_name, message) VALUES
      (gen_random_uuid(), $1, 'Uncle Bob', 'Wishing you a lifetime of happiness!'),
      (gen_random_uuid(), $1, 'Aunt May', 'Such a lovely wedding, congratulations dear.'),
      (gen_random_uuid(), $1, 'Cousin Vinnie', 'Best party ever! Cheers!'),
      (gen_random_uuid(), $1, 'Sarah J.', 'Can''t wait to see what the future holds for you both.')
    `, [eventId]);
    console.log("Guestbook messages inserted.");

    // 8. Insert Song Requests
    await pool.query(`
      INSERT INTO song_requests (id, event_id, song_title, requested_by, votes) VALUES
      (gen_random_uuid(), $1, 'Perfect - Ed Sheeran', 'Jane S.', 5),
      (gen_random_uuid(), $1, 'Uptown Funk - Bruno Mars', 'Chris B.', 12),
      (gen_random_uuid(), $1, 'I Gotta Feeling - Black Eyed Peas', 'Michael J.', 8),
      (gen_random_uuid(), $1, 'Thinking Out Loud - Ed Sheeran', 'Emily W.', 3)
    `, [eventId]);
    console.log("Song requests inserted.");

    // 9. Insert Live Chat Messages
    await pool.query(`
      INSERT INTO live_chat_messages (id, event_id, guest_id, sender_name, message, is_admin) VALUES
      (gen_random_uuid(), $1, $2, 'John Doe', 'Hey everyone, the food is amazing!', false),
      (gen_random_uuid(), $1, $3, 'Jane Smith', 'I know right? Just tried the salmon.', false),
      (gen_random_uuid(), $1, NULL, 'Admin User', 'Glad you are enjoying it! The cake cutting is in 10 minutes.', true),
      (gen_random_uuid(), $1, $4, 'Michael Johnson', 'On my way to the main hall!', false)
    `, [eventId, guestIds[0], guestIds[1], guestIds[2]]);
    console.log("Live chat messages inserted.");

    console.log("Seed completed successfully!");
  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    await pool.end();
  }
}

seed();
