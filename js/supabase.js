import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Tambahkan ini untuk debugging
supabase.from('watchlist').select('*').then(console.log).catch(console.error)