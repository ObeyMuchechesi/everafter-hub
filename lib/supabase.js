import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdasxjyownfcurdidoec.supabase.co'
const supabaseAnonKey = 'sb_publishable_w3gCq74qZJ-O1BoDd_UTzw_FLetvs8r'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)