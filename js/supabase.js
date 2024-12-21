// Menggunakan createClient dari window.supabase yang disediakan oleh CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export ke window object agar bisa diakses dari file lain
window.supabase = supabase;

// Tambahkan ini untuk debugging
console.log('Supabase client initialized:', supabase);