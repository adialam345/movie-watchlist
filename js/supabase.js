const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export supabase client ke window agar bisa diakses dari file lain
window.supabase = supabase;

// Tambahkan ini untuk debugging
supabase.from('watchlist').select('*').then(console.log).catch(console.error)