const SUPABASE_URL = 'https://itwcgeclpgsvccgcncii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d2NnZWNscGdzdmNjZ2NuY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MTIyNTQsImV4cCI6MjA1MDM4ODI1NH0.9Q0Kvzth3OJElVYY6y09hCByPDFVZuqyfo8Rv4zaAr8';

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export ke window object
window.supabase = supabase;

// Debug log
console.log('Supabase client initialized:', supabase);