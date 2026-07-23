const { Pool } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envLocal.match(/DATABASE_URL="(.*)"/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
});

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedMassive() {
  try {
    console.log("Starting massive DB seed...");
    const userRes = await pool.query("SELECT id FROM users WHERE email = 'admin@everafter.com'");
    if (userRes.rows.length === 0) {
      console.error("Admin user not found!");
      return;
    }
    const adminId = userRes.rows[0].id;
    console.log("Admin ID:", adminId);

    // Clean up
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

    const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Gala'];
    const venues = ['The Grand Palace', 'Oceanview Pavilion', 'Mountain Retreat', 'City Center Hall', 'Rustic Barn'];

    // Generate 15 events
    const eventIds = [];
    for (let i = 1; i <= 15; i++) {
      const isMega = i === 1;
      const eventName = isMega ? 'Mega Stress Test Event' : `Dummy Event ${i}`;
      const slug = isMega ? 'mega-event' : `dummy-event-${i}`;
      
      const eventRes = await pool.query(`
        INSERT INTO events (
          id, user_id, event_type, event_name, host_name, event_date, venue, slug, guest_access_url, qr_code_value, is_active, background_theme, cover_photo, number_of_tables, chairs_per_table, is_deleted
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'Admin User', CURRENT_DATE + INTERVAL '${i * 5} days', $4, $5, $6, $7, true, '#ffffff', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80', $8, 10, false
        ) RETURNING id
      `, [
        adminId, 
        randomPick(eventTypes), 
        eventName, 
        randomPick(venues), 
        slug, 
        `http://localhost:3000/event/${slug}`, 
        `http://localhost:3000/event/${slug}`,
        isMega ? 100 : 10
      ]);
      const eventId = eventRes.rows[0].id;
      eventIds.push({ id: eventId, isMega });
    }
    console.log("15 Events created.");

    // Helper for bulk insert
    const insertInBatches = async (queryStr, dataList, batchSize = 100) => {
      for (let i = 0; i < dataList.length; i += batchSize) {
        const batch = dataList.slice(i, i + batchSize);
        // Build values clause
        const numCols = batch[0].length;
        const values = [];
        const flatData = [];
        let paramIdx = 1;
        for (let row of batch) {
          const rowParams = [];
          for (let val of row) {
            rowParams.push(`$${paramIdx++}`);
            flatData.push(val);
          }
          values.push(`(${rowParams.join(', ')})`);
        }
        await pool.query(`${queryStr} VALUES ${values.join(', ')}`, flatData);
      }
    };

    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Laura', 'James', 'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Amanda', 'Andrew', 'Melissa', 'Tom', 'Jerry', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Linda'];
    const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Martinez', 'Rodriguez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis'];

    for (const { id: eventId, isMega } of eventIds) {
      // 1. Guests
      const numGuests = isMega ? 1500 : 30;
      const guestData = [];
      for (let i = 0; i < numGuests; i++) {
        const fn = randomPick(firstNames);
        const ln = randomPick(lastNames);
        const rsvp = i % 10 === 0 ? 'Declined' : (i % 8 === 0 ? 'Pending' : 'Attending');
        guestData.push([
          eventId, fn, ln, (i % (isMega ? 100 : 10)) + 1, rsvp, 
          i % 15 === 0 ? 'Vegan' : (i % 20 === 0 ? 'Gluten-Free' : 'None'), 
          true, `+1555${String(Math.floor(Math.random()*1000000)).padStart(7, '0')}`
        ]);
      }
      await insertInBatches(`INSERT INTO guests (event_id, first_name, last_name, table_number, rsvp_status, dietary_requirements, is_reserved, phone_number)`, guestData);
      
      // Get some guest IDs for live chat
      const guestsRes = await pool.query("SELECT id FROM guests WHERE event_id = $1 LIMIT 50", [eventId]);
      const someGuestIds = guestsRes.rows.map(r => r.id);

      // 2. Timeline
      const numTimeline = isMega ? 20 : 5;
      const timelineData = [];
      for (let i = 0; i < numTimeline; i++) {
        timelineData.push([eventId, `${10 + (i % 12)}:00`, `Event Activity ${i+1}`, 'Main Area', i]);
      }
      await insertInBatches(`INSERT INTO timeline_items (event_id, event_time, title, location, sort_order)`, timelineData);

      // 3. Menu
      const numMenu = isMega ? 30 : 6;
      const menuData = [];
      for (let i = 0; i < numMenu; i++) {
        const type = i % 4 === 0 ? 'starter' : (i % 4 === 1 ? 'main' : (i % 4 === 2 ? 'dessert' : 'starter'));
        menuData.push([eventId, type, `Dish ${i+1}`, `Description for dish ${i+1}`]);
      }
      await insertInBatches(`INSERT INTO menu_items (event_id, course_type, dish_name, description)`, menuData);

      // 4. Photos
      const numPhotos = isMega ? 500 : 10;
      const photoData = [];
      for (let i = 0; i < numPhotos; i++) {
        photoData.push([eventId, `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80&sig=${Math.random()}`, `Awesome moment ${i}`, randomPick(firstNames), true]);
      }
      await insertInBatches(`INSERT INTO photos (event_id, image_url, caption, uploaded_by, is_approved)`, photoData);

      // 5. Guestbook
      const numGuestbook = isMega ? 800 : 15;
      const gbData = [];
      for (let i = 0; i < numGuestbook; i++) {
        gbData.push([eventId, `${randomPick(firstNames)} ${randomPick(lastNames)}`, `Wishing you the best! Message #${i}`]);
      }
      await insertInBatches(`INSERT INTO guestbook (event_id, guest_name, message)`, gbData);

      // 6. Song Requests
      const numSongs = isMega ? 300 : 8;
      const songData = [];
      for (let i = 0; i < numSongs; i++) {
        songData.push([eventId, `Song Title ${i}`, randomPick(firstNames), Math.floor(Math.random() * 50)]);
      }
      await insertInBatches(`INSERT INTO song_requests (event_id, song_title, requested_by, votes)`, songData);

      // 7. Live Chat Messages
      const numChat = isMega ? 1500 : 20;
      const chatData = [];
      for (let i = 0; i < numChat; i++) {
        const isAd = i % 50 === 0;
        const gId = isAd ? null : randomPick(someGuestIds);
        chatData.push([eventId, gId, isAd ? 'Admin' : randomPick(firstNames), `This is chat message #${i}!`, isAd]);
      }
      await insertInBatches(`INSERT INTO live_chat_messages (event_id, guest_id, sender_name, message, is_admin)`, chatData);
    }

    console.log("Massive seed completed successfully!");
  } catch (err) {
    console.error("Error massive seeding DB:", err);
  } finally {
    await pool.end();
  }
}

seedMassive();
