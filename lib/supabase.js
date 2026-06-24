import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lacxysmgnglafvsnrxkj.supabase.co'
const supabaseAnonKey = 'sb_publishable_y1JC_9ofyIeTh2O4seRGig_6dv5i1e3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)