import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from './lib/db.js';

async function setupLiveChat() {
  try {
    console.log('Creating live_chat_messages table...');
    await query(`
      CREATE TABLE IF NOT EXISTS public.live_chat_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
        sender_name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `);
    
    console.log('Enabling RLS on live_chat_messages...');
    await query(`ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;`);
    
    console.log('Creating policies...');
    await query(`
      DROP POLICY IF EXISTS "Allow public read access to live chat" ON public.live_chat_messages;
      CREATE POLICY "Allow public read access to live chat"
      ON public.live_chat_messages FOR SELECT
      TO anon, authenticated
      USING (true);
    `);

    await query(`
      DROP POLICY IF EXISTS "Allow public insert to live chat" ON public.live_chat_messages;
      CREATE POLICY "Allow public insert to live chat"
      ON public.live_chat_messages FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    `);

    console.log('Live chat setup complete.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

setupLiveChat();
