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
