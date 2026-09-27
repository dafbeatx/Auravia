import { supabase } from '@/lib/supabase';
import { DatabaseError } from '@/lib/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type TemplateRow = Tables<'templates'>;
export type TemplateInsert = TablesInsert<'templates'>;
export type TemplateUpdate = TablesUpdate<'templates'>;

export interface DashboardStats {
  total_users: number;
  total_invitations: number;
  total_templates: number;
  active_templates: number;
  draft_templates: number;
  total_demo_views: number;
  total_visitors: number;
  total_invitation_views: number;
}

export interface TrafficStatItem {
  day_date: string;
  visitors: number;
  page_views: number;
  demo_views: number;
  login_success: number;
  register_success: number;
  invitation_create: number;
  invitation_publish: number;
}

export interface TemplatePerformanceItem {
  template_id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  demo_views: number;
  unique_visitors: number;
  published_usage: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  invitation_count: number;
  published_count: number;
}

/**
 * Mengambil ringkasan statistik dashboard admin secara agregat dari database.
 */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
  if (error) {
    throw new DatabaseError('Gagal memuat statistik dashboard admin.', error);
  }
  return data as unknown as DashboardStats;
}

/**
 * Mengambil data rincian traffic berkala (7 hari, 30 hari, dsb).
 */
export async function getAdminTrafficStats(days = 30): Promise<TrafficStatItem[]> {
  const { data, error } = await supabase.rpc('get_admin_traffic_stats', {
    period_days: days,
  });
  if (error) {
    throw new DatabaseError('Gagal memuat statistik traffic admin.', error);
  }
  return (data ?? []) as TrafficStatItem[];
}

/**
 * Mengambil matriks performa katalog template.
 */
export async function getAdminTemplatePerformance(): Promise<TemplatePerformanceItem[]> {
  const { data, error } = await supabase.rpc('get_admin_template_performance');
  if (error) {
    throw new DatabaseError('Gagal memuat performa template.', error);
  }
  return (data ?? []) as TemplatePerformanceItem[];
}

/**
 * Mengambil daftar pengguna untuk admin (tanpa mengekspos token atau password).
 */
export async function getAdminUsersList(
  searchTerm?: string,
  roleFilter?: string
): Promise<AdminUserItem[]> {
  const { data, error } = await supabase.rpc('get_admin_users_list', {
    search_term: searchTerm && searchTerm.trim().length > 0 ? searchTerm.trim() : null,
    role_filter: roleFilter && roleFilter !== 'all' ? roleFilter : null,
  });
  if (error) {
    throw new DatabaseError('Gagal memuat daftar pengguna.', error);
  }
  return (data ?? []) as AdminUserItem[];
}

/**
 * Mengambil seluruh daftar template untuk panel manajemen admin.
 */
export async function getAdminTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Gagal memuat daftar template untuk admin.', error);
  }
  return data ?? [];
}

/**
 * Mengambil detail template berdasarkan ID untuk admin editor.
 */
export async function getAdminTemplateById(id: string): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat detail template admin.', error);
  }
  return data;
}

/**
 * Memperbarui template oleh admin.
 */
export async function updateAdminTemplate(
  id: string,
  payload: TemplateUpdate
): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Gagal memperbarui template.', error);
  }
  return data;
}

/**
 * Membuat template baru oleh admin.
 */
export async function createAdminTemplate(
  payload: TemplateInsert
): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new DatabaseError('Gagal membuat template baru.', error);
  }
  return data;
}

/**
 * Menghapus template secara permanen jika tidak digunakan oleh undangan yang aktif.
 */
export async function deleteAdminTemplate(id: string): Promise<void> {
  // Cek apakah ada undangan yang mengaitkan template ini
  const { count, error: countErr } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', id);

  if (countErr) {
    throw new DatabaseError('Gagal memeriksa relasi template.', countErr);
  }

  if (count && count > 0) {
    throw new Error(
      `Template ini tidak dapat dihapus karena sedang digunakan oleh ${count} undangan. Ubah statusnya menjadi 'archived' sebagai gantinya.`
    );
  }

  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) {
    throw new DatabaseError('Gagal menghapus template.', error);
  }
}

/**
 * Validasi dan upload preview gambar template ke bucket 'template-assets'.
 */
export async function uploadTemplatePreviewImage(
  templateId: string,
  type: 'mobile' | 'desktop' | 'thumbnail',
  file: File
): Promise<{ path: string; publicUrl: string }> {
  // 1. Validasi tipe MIME
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMime.includes(file.type)) {
    throw new Error('Format file tidak didukung. Harap unggah file JPEG, PNG, atau WebP.');
  }

  // 2. Validasi ukuran berkas (Maksimal 5 MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file melebihi batas 5 MB.');
  }

  // 3. Tentukan ekstensi dan path aman
  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const timestamp = Date.now();
  const filePath = `templates/${templateId}/preview/${type}_${timestamp}.${ext}`;

  // 4. Upload ke storage
  const { error: uploadErr } = await supabase.storage
    .from('template-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    throw new DatabaseError('Gagal mengunggah gambar ke storage.', uploadErr);
  }

  // 5. Ambil URL publik
  const { data: urlData } = supabase.storage
    .from('template-assets')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Menghapus file gambar lama dari bucket 'template-assets' setelah penggantian berhasil.
 */
export async function deleteTemplateAsset(filePath: string): Promise<void> {
  if (!filePath || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return;
  }
  try {
    await supabase.storage.from('template-assets').remove([filePath]);
  } catch {
    // Non-blocking jika file lama sudah tidak ada
  }
}

/**
 * Mendapatkan Public URL dari storage path bucket 'template-assets'
 */
export function getTemplateAssetPublicUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  const { data } = supabase.storage.from('template-assets').getPublicUrl(path);
  return data.publicUrl;
}

export interface AdminIdentity {
  id?: string;
  username: string | null;
  role: string;
  email: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Autentikasi Admin via Username dan Password.
 * Melakukan resolusi username -> auth email di server-side secara aman,
 * lalu memvalidasi credential via Supabase Auth signInWithPassword.
 * Mengembalikan pesan generik 'Username atau password salah.' pada semua kegagalan
 * guna mencegah user enumeration.
 */
export async function loginAdminWithUsername(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUsername = usernameInput.trim();
  if (!cleanUsername || !passwordInput) {
    return { success: false, error: 'Username atau password salah.' };
  }

  try {
    // 1. Resolve username to admin email via secure Postgres function
    const { data: adminEmail, error: rpcError } = await supabase.rpc('get_admin_login_email', {
      p_username: cleanUsername,
    });

    if (rpcError || !adminEmail) {
      // Delay konsisten untuk mencegah timing attack
      await new Promise((resolve) => setTimeout(resolve, 350));
      return { success: false, error: 'Username atau password salah.' };
    }

    // 2. Autentikasi password via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: passwordInput,
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Username atau password salah.' };
    }

    // 3. Verifikasi role admin secara langsung dari profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || profileData?.role !== 'admin') {
      // Jika bukan admin, segera cabut sesi Supabase Auth
      await supabase.auth.signOut();
      return { success: false, error: 'Username atau password salah.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Username atau password salah.' };
  }
}

/**
 * Mengambil identitas admin yang sedang login (username, email, role).
 */
export async function getAdminIdentity(): Promise<AdminIdentity> {
  const { data, error } = await supabase.rpc('get_admin_identity');
  if (error) {
    throw new DatabaseError('Gagal memuat identitas admin.', error);
  }
  return data as unknown as AdminIdentity;
}

/**
 * Mengubah username admin yang sedang login.
 */
export async function updateAdminUsername(newUsername: string): Promise<string> {
  const cleaned = newUsername.trim().toLowerCase();
  if (cleaned.length < 3 || cleaned.length > 30) {
    throw new Error('Username harus memiliki panjang antara 3 sampai 30 karakter.');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleaned)) {
    throw new Error('Username hanya boleh mengandung huruf, angka, underscore (_), titik (.), dan strip (-).');
  }

  const { data, error } = await supabase.rpc('update_admin_username', {
    p_new_username: cleaned,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal memperbarui username admin.', error);
  }

  const result = data as { success: boolean; username: string };
  return result.username;
}

/**
 * Mengubah password admin dengan verifikasi password lama terlebih dahulu.
 * Setelah password berhasil diubah, seluruh sesi lama di-sign out untuk keamanan.
 */
export async function updateAdminPassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!oldPassword) {
    return { success: false, error: 'Password lama wajib diisi.' };
  }
  if (!newPassword) {
    return { success: false, error: 'Password baru wajib diisi.' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'Password baru minimal 8 karakter.' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Password baru dan konfirmasi password tidak cocok.' };
  }

  // 1. Dapatkan pengguna saat ini
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.email) {
    return { success: false, error: 'Sesi admin tidak ditemukan. Silakan login kembali.' };
  }

  // 2. Verifikasi kecocokan password lama dengan autentikasi ulang
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: oldPassword,
  });

  if (reauthError) {
    return { success: false, error: 'Password lama tidak sesuai.' };
  }

  // 3. Update password via Supabase Auth (server-side hashing bcrypt)
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message || 'Gagal memperbarui password.' };
  }

  // 4. Logout untuk menginvalidasi sesi lama
  await supabase.auth.signOut();

  return { success: true };
}
