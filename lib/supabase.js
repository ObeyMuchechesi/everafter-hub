import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irijfdkwedveecpxwvkv.supabase.co'
const supabaseAnonKey = 'sb_publishable_KSjy9N9oKdN6Ygypt76y8Q_9042qZNn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)