import { supabase } from '@/lib/supabase';
import { DatabaseError } from '@/lib/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';
import { getAdminToken, changeAdminOwnPassword } from '@/lib/adminAuth';

export type TemplateRow = Tables<'templates'>;
export type TemplateInsert = TablesInsert<'templates'>;
export type TemplateUpdate = TablesUpdate<'templates'>;

export interface AdminActivityLogItem {
  id: string;
  admin_id: string | null;
  admin_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

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

export interface DashboardStatsV2 {
  total_users: number;
  users_today: number;
  total_invitations: number;
  invitations_draft: number;
  invitations_published: number;
  total_templates: number;
  active_templates: number;
  total_page_views: number;
  total_visitors: number;
  demo_views: number;
  login_attempts: number;
  error_events: number;
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

export interface AdminTrafficLogItem {
  id: string;
  event_name: string;
  path: string;
  session_id: string;
  user_id: string | null;
  template_id: string | null;
  template_name: string | null;
  invitation_id: string | null;
  invitation_slug: string | null;
  referrer: string | null;
  device_type: string;
  browser: string | null;
  created_at: string;
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
  status?: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_sign_in_at: string | null;
  invitation_count: number;
  published_count: number;
}

export interface AdminInvitationItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  user_id: string;
  owner_name: string | null;
  owner_email: string;
  template_id: string | null;
  template_name: string | null;
  template_slug: string | null;
}

export interface SystemSettingsData {
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color?: string | null;
  contact_email?: string | null;
  social_links?: {
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
    [key: string]: string | undefined;
  } | null;
  landing_content?: {
    hero_headline?: string;
    hero_subheadline?: string;
    hero_cta_text?: string;
    hero_cta_link?: string;
    secondary_cta_text?: string;
    secondary_cta_link?: string;
    hero_image_url?: string;
    section_visibility?: {
      hero?: boolean;
      features?: boolean;
      template_showcase?: boolean;
      invitation_preview?: boolean;
      process?: boolean;
      faq?: boolean;
      cta_banner?: boolean;
      [key: string]: boolean | undefined;
    };
    features?: Array<{ id: string; title: string; description: string }>;
    faq_items?: Array<{ question: string; answer: string }>;
    [key: string]: unknown;
  } | null;
  default_seo_title: string;
  default_seo_description: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  catalog_enabled: boolean;
  analytics_enabled: boolean;
  updated_at?: string;
}

export interface TemplateDemoData {
  id?: string;
  template_id?: string;
  hero: Record<string, unknown>;
  couple: Record<string, unknown>;
  story: unknown[];
  events: unknown[];
  gallery: unknown[];
  quote: Record<string, unknown>;
  gift: Record<string, unknown>;
  rsvp: Record<string, unknown>;
  wishes: Record<string, unknown>;
  closing: Record<string, unknown>;
  updated_at?: string;
}

/**
 * Mengambil ringkasan statistik dashboard admin secara agregat dari database (v1 legacy).
 */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
  if (error) {
    throw new DatabaseError('Gagal memuat statistik dashboard admin.', error);
  }
  return data as unknown as DashboardStats;
}

/**
 * Mengambil ringkasan statistik dashboard lengkap (v2).
 */
export async function getAdminDashboardStatsV2(): Promise<DashboardStatsV2> {
  const token = getAdminToken();
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats_v2', {
    p_token: token,
  });
  if (error || !data) {
    // Fallback ke penghitungan dari v1 jika v2 belum diterapkan di DB
    try {
      const v1 = await getAdminDashboardStats();
      return {
        total_users: v1.total_users || 0,
        users_today: 0,
        total_invitations: v1.total_invitations || 0,
        invitations_draft: v1.draft_templates || 0,
        invitations_published: v1.total_invitations || 0,
        total_templates: v1.total_templates || 0,
        active_templates: v1.active_templates || 0,
        total_page_views: v1.total_invitation_views || 0,
        total_visitors: v1.total_visitors || 0,
        demo_views: v1.total_demo_views || 0,
        login_attempts: 0,
        error_events: 0,
      };
    } catch {
      throw new DatabaseError('Gagal memuat statistik dashboard lengkap.', error);
    }
  }
  return data as unknown as DashboardStatsV2;
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
 * Mengambil log traffic detail analitik.
 */
export async function getAdminTrafficLogs(
  days = 30,
  eventFilter = 'all',
  limit = 100,
  offset = 0
): Promise<AdminTrafficLogItem[]> {
  const token = getAdminToken();
  if (!token) return [];

  const { data, error } = await supabase.rpc('get_admin_traffic_logs', {
    p_token: token,
    p_period_days: days,
    p_event_filter: eventFilter === 'all' ? null : eventFilter,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw new DatabaseError('Gagal memuat log analitik lalu lintas.', error);
  }
  return (data ?? []) as AdminTrafficLogItem[];
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
 * Mengubah status pengguna (active, inactive, suspended).
 */
export async function setAdminUserStatus(
  userId: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesi admin tidak ditemukan.');

  const { error } = await supabase.rpc('admin_set_user_status', {
    p_token: token,
    p_user_id: userId,
    p_status: status,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal mengubah status pengguna.', error);
  }
}

/**
 * Menghapus akun pengguna secara permanen oleh Super Admin.
 */
export async function deleteAdminUser(userId: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesi admin tidak ditemukan.');

  const { error } = await supabase.rpc('admin_delete_user', {
    p_token: token,
    p_user_id: userId,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal menghapus pengguna.', error);
  }
}

/**
 * Mengambil daftar undangan untuk manajemen admin.
 */
export async function getAdminInvitationsList(
  search?: string,
  status?: string,
  template?: string
): Promise<AdminInvitationItem[]> {
  const token = getAdminToken();
  if (!token) return [];

  const { data, error } = await supabase.rpc('get_admin_invitations_list', {
    p_token: token,
    p_search: search && search.trim().length > 0 ? search.trim() : null,
    p_status: status && status !== 'all' ? status : null,
    p_template: template && template !== 'all' ? template : null,
  });

  if (error) {
    throw new DatabaseError('Gagal memuat daftar undangan.', error);
  }

  return (data ?? []) as AdminInvitationItem[];
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
 * Mengambil data demo template yang dikelola admin berdasarkan slug template.
 */
export async function getTemplateDemoData(slug: string): Promise<TemplateDemoData | null> {
  try {
    const { data, error } = await supabase.rpc('get_template_demo_data', {
      p_slug: slug,
    });
    if (error || !data) return null;
    return data as unknown as TemplateDemoData;
  } catch {
    return null;
  }
}

/**
 * Menyimpan pembaruan data demo template oleh admin.
 */
export async function adminSaveTemplateDemo(
  templateId: string,
  demoData: Partial<TemplateDemoData>
): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesi admin tidak ditemukan.');

  const { error } = await supabase.rpc('admin_save_template_demo', {
    p_token: token,
    p_template_id: templateId,
    p_demo_data: demoData as unknown as import('@/types/database').Json,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal menyimpan data demo template.', error);
  }
}

/**
 * Validasi dan upload media demo ke bucket 'template-demo-media'.
 */
export async function uploadDemoMedia(
  templateId: string,
  section: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMime.includes(file.type)) {
    throw new Error('Format file tidak didukung. Harap unggah file JPEG, PNG, atau WebP.');
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file melebihi batas 5 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const timestamp = Date.now();
  const filePath = `demo/${templateId}/${section}/${timestamp}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('template-demo-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    throw new DatabaseError('Gagal mengunggah media demo ke storage.', uploadErr);
  }

  const { data: urlData } = supabase.storage
    .from('template-demo-media')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Mendapatkan Public URL dari media demo.
 */
export function getDemoMediaPublicUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('/')) {
    return path;
  }
  const { data } = supabase.storage.from('template-demo-media').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Validasi dan upload preview gambar template ke bucket 'template-assets'.
 */
export async function uploadTemplatePreviewImage(
  templateId: string,
  type: 'mobile' | 'desktop' | 'thumbnail',
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMime.includes(file.type)) {
    throw new Error('Format file tidak didukung. Harap unggah file JPEG, PNG, atau WebP.');
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file melebihi batas 5 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const timestamp = Date.now();
  const filePath = `templates/${templateId}/preview/${type}_${timestamp}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('template-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadErr) {
    throw new DatabaseError('Gagal mengunggah gambar ke storage.', uploadErr);
  }

  const { data: urlData } = supabase.storage
    .from('template-assets')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Menghapus file gambar lama dari bucket 'template-assets'.
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
 * Mendapatkan Public URL dari storage path bucket 'template-assets'.
 */
export function getTemplateAssetPublicUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  const { data } = supabase.storage.from('template-assets').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Mengambil pengaturan sistem platform dari database.
 */
export async function getSystemSettings(): Promise<SystemSettingsData> {
  const defaultSettings: SystemSettingsData = {
    site_name: 'Aurovia',
    logo_url: null,
    favicon_url: null,
    brand_color: '#006A71',
    contact_email: 'support@aurovia.id',
    social_links: {
      instagram: 'https://instagram.com/aurovia.id',
      whatsapp: 'https://wa.me/6281234567890',
      tiktok: 'https://tiktok.com/@aurovia.id',
    },
    landing_content: {
      hero_headline: 'Abadikan Momen Sakral dalam Lembaran Digital Abadi',
      hero_subheadline: 'Desain kurasi eksklusif, RSVP terkonfirmasi, dan tata visual anggun untuk pernikahan impian Anda.',
      hero_cta_text: 'Mulai Buat Undangan',
      hero_cta_link: '/register',
      secondary_cta_text: 'Lihat Katalog Template',
      secondary_cta_link: '/#template',
      hero_image_url: '',
      section_visibility: {
        hero: true,
        features: true,
        template_showcase: true,
        invitation_preview: true,
        process: true,
        faq: true,
        cta_banner: true,
      },
    },
    default_seo_title: 'Aurovia - Undangan Pernikahan Digital Elegan',
    default_seo_description: 'Platform undangan digital pernikahan eksklusif dengan desain kurasi modern, RSVP interaktif, dan sentuhan visual premium.',
    maintenance_mode: false,
    registration_enabled: true,
    catalog_enabled: true,
    analytics_enabled: true,
  };

  try {
    const { data, error } = await supabase.rpc('get_system_settings');
    if (error || !data) {
      return defaultSettings;
    }
    return {
      ...defaultSettings,
      ...(data as unknown as SystemSettingsData),
    };
  } catch {
    return defaultSettings;
  }
}

/**
 * Memperbarui pengaturan sistem platform (Khusus Super Admin).
 */
export async function updateSystemSettings(
  settings: Partial<SystemSettingsData>
): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Sesi admin tidak ditemukan.');

  const { error } = await supabase.rpc('admin_update_system_settings', {
    p_token: token,
    p_settings: settings as unknown as import('@/types/database').Json,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal memperbarui pengaturan sistem.', error);
  }
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
 * Autentikasi Admin via Username dan Password (Legacy bridge).
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
    const { data: adminEmail, error: rpcError } = await supabase.rpc('get_admin_login_email', {
      p_username: cleanUsername,
    });

    if (rpcError || !adminEmail) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return { success: false, error: 'Username atau password salah.' };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: passwordInput,
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Username atau password salah.' };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || profileData?.role !== 'admin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Username atau password salah.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Username atau password salah.' };
  }
}

/**
 * Mengambil identitas admin yang sedang login.
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
    throw new Error('Username hanya boleh mengandung huruf, angka, underscore, titik, dan strip.');
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

  try {
    await changeAdminOwnPassword(oldPassword, newPassword);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memperbarui password.',
    };
  }
}

/**
 * Mengambil log aktivitas administrator dengan pagination dan filter aksi.
 */
export async function getAdminActivityLogs(
  actionFilter?: string,
  limit: number = 50,
  offset: number = 0
): Promise<AdminActivityLogItem[]> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { data, error } = await supabase.rpc('get_admin_activity_logs', {
    p_token: token,
    p_action_filter: actionFilter || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal memuat log aktivitas admin.', error);
  }

  return (data ?? []) as unknown as AdminActivityLogItem[];
}

/**
 * Mencatat log aktivitas admin ke server PostgreSQL.
 */
export async function recordAdminActivity(
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const { data, error } = await supabase.rpc('admin_record_activity', {
      p_token: token,
      p_action: action,
      p_target_type: targetType || null,
      p_target_id: targetId || null,
      p_metadata: (metadata || {}) as unknown as import('@/types/database').Json,
    });
    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Menduplikasi template dan demo datanya.
 */
export async function duplicateAdminTemplate(templateId: string): Promise<string> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { data, error } = await supabase.rpc('admin_duplicate_template', {
    p_token: token,
    p_template_id: templateId,
  });

  if (error) {
    throw new DatabaseError(error.message || 'Gagal menduplikasi template.', error);
  }

  return data as string;
}

export interface PlatformMediaItem {
  id: string;
  url: string;
  name: string;
  type: 'hero' | 'couple' | 'gallery' | 'preview' | 'cover' | 'other';
  template_id?: string;
  template_name?: string;
  storage_path?: string;
}

/**
 * Mengumpulkan semua aset media template dan foto demo dari database platform.
 */
export async function listAllPlatformMedia(): Promise<PlatformMediaItem[]> {
  const mediaItems: PlatformMediaItem[] = [];
  const seenUrls = new Set<string>();

  try {
    const templates = await getAdminTemplates();
    for (const t of templates) {
      if (t.thumbnail_url && !seenUrls.has(t.thumbnail_url)) {
        seenUrls.add(t.thumbnail_url);
        mediaItems.push({
          id: `thumb-${t.id}`,
          url: t.thumbnail_url,
          name: `${t.name} Thumbnail`,
          type: 'preview',
          template_id: t.id,
          template_name: t.name,
        });
      }

      if (t.preview_desktop_path && !seenUrls.has(t.preview_desktop_path)) {
        seenUrls.add(t.preview_desktop_path);
        const url = getTemplateAssetPublicUrl(t.preview_desktop_path);
        mediaItems.push({
          id: `prev-desk-${t.id}`,
          url,
          name: `${t.name} Desktop Preview`,
          type: 'preview',
          template_id: t.id,
          template_name: t.name,
          storage_path: t.preview_desktop_path,
        });
      }

      if (t.preview_mobile_path && !seenUrls.has(t.preview_mobile_path)) {
        seenUrls.add(t.preview_mobile_path);
        const url = getTemplateAssetPublicUrl(t.preview_mobile_path);
        mediaItems.push({
          id: `prev-mob-${t.id}`,
          url,
          name: `${t.name} Mobile Preview`,
          type: 'preview',
          template_id: t.id,
          template_name: t.name,
          storage_path: t.preview_mobile_path,
        });
      }

      // Ambil demo media
      try {
        const demo = await getTemplateDemoData(t.id);
        if (demo) {
          const hero = demo.hero as Record<string, unknown> | undefined;
          if (hero?.background_image && typeof hero.background_image === 'string' && !seenUrls.has(hero.background_image)) {
            seenUrls.add(hero.background_image);
            mediaItems.push({
              id: `hero-bg-${t.id}`,
              url: hero.background_image,
              name: `${t.name} Hero Background`,
              type: 'hero',
              template_id: t.id,
              template_name: t.name,
            });
          }
          if (hero?.cover_image && typeof hero.cover_image === 'string' && !seenUrls.has(hero.cover_image)) {
            seenUrls.add(hero.cover_image);
            mediaItems.push({
              id: `hero-cov-${t.id}`,
              url: hero.cover_image,
              name: `${t.name} Hero Cover`,
              type: 'cover',
              template_id: t.id,
              template_name: t.name,
            });
          }

          const couple = demo.couple as Record<string, unknown> | undefined;
          if (couple?.groom_photo && typeof couple.groom_photo === 'string' && !seenUrls.has(couple.groom_photo)) {
            seenUrls.add(couple.groom_photo);
            mediaItems.push({
              id: `cpl-g-${t.id}`,
              url: couple.groom_photo,
              name: `${t.name} Foto Mempelai Pria`,
              type: 'couple',
              template_id: t.id,
              template_name: t.name,
            });
          }
          if (couple?.bride_photo && typeof couple.bride_photo === 'string' && !seenUrls.has(couple.bride_photo)) {
            seenUrls.add(couple.bride_photo);
            mediaItems.push({
              id: `cpl-b-${t.id}`,
              url: couple.bride_photo,
              name: `${t.name} Foto Mempelai Wanita`,
              type: 'couple',
              template_id: t.id,
              template_name: t.name,
            });
          }

          if (Array.isArray(demo.gallery)) {
            demo.gallery.forEach((item: unknown, idx: number) => {
              const gItem = item as { image_url?: string; caption?: string };
              if (gItem?.image_url && !seenUrls.has(gItem.image_url)) {
                seenUrls.add(gItem.image_url);
                mediaItems.push({
                  id: `gal-${t.id}-${idx}`,
                  url: gItem.image_url,
                  name: gItem.caption || `${t.name} Galeri ${idx + 1}`,
                  type: 'gallery',
                  template_id: t.id,
                  template_name: t.name,
                });
              }
            });
          }
        }
      } catch {
        // Abaikan kesalahan pembacaan demo spesifik per template
      }
    }
  } catch (err) {
    console.error('Gagal mengambil daftar media:', err);
  }

  return mediaItems;
}


