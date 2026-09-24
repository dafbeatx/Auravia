import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Hanya log peringatan di development jika env belum diisi
  console.warn(
    '[Aurovia Supabase Client]: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum dikonfigurasi. Periksa file .env Anda.'
  );
}

/**
 * Supabase Client resmi Aurovia untuk sisi peramban (browser).
 * Hanya menggunakan Anon Public Key. DILARANG menggunakan Service Role Key di sini.
 * Client ini tidak melakukan eager query / auto-fetch saat inisialisasi.
 */
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder-project.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
