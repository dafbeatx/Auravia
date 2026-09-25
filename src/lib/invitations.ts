import { supabase } from '@/lib/supabase';
import { AuthenticationError, AuthorizationError, DatabaseError, StorageError, ValidationError } from '@/lib/errors';
import type { Tables, TablesUpdate } from '@/types/database';
import type { InvitationContent } from '@/lib/template/types';

export type InvitationListItem = Pick<
  Tables<'invitations'>,
  'id' | 'slug' | 'title' | 'event_type' | 'status' | 'created_at' | 'updated_at'
> & {
  data?:
    | { content: import('@/types/database').Json }
    | Array<{ content: import('@/types/database').Json }>
    | null;
  gallery?: Array<{
    id: string;
    storage_path: string;
    thumbnail_path: string | null;
  }> | null;
};

export type InvitationDetail = Pick<
  Tables<'invitations'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'event_type'
  | 'template_id'
  | 'status'
  | 'allow_rsvp'
  | 'show_wishes'
  | 'theme_override'
  | 'published_at'
  | 'created_at'
  | 'updated_at'
>;

export type TemplateListItem = Pick<
  Tables<'templates'>,
  'id' | 'slug' | 'name' | 'category' | 'description' | 'default_theme'
>;

/**
 * Mengambil daftar template aktif dari katalog untuk pemilihan pembuatan undangan.
 * Mengambil hanya kolom-kolom yang diperlukan untuk efisiensi egress.
 */
export async function getActiveTemplates(): Promise<TemplateListItem[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, name, category, description, default_theme')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat katalog template.', error);
  }

  return data ?? [];
}

/**
 * Membuat slug URL-safe yang deterministik dan memenuhi batasan regex PostgreSQL:
 * ^[a-z0-9]+(-[a-z0-9]+)*$ serta panjang antara 3 hingga 60 karakter.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cleanBase = base.length >= 3 ? base.slice(0, 48) : 'undangan';
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${cleanBase}-${suffix}`;
}

/**
 * Membuat draft undangan baru untuk pengguna terautentikasi dengan template pilihan.
 * Sesi pengguna diverifikasi langsung dari Supabase Auth untuk mencegah pemalsuan user_id.
 */
export async function createInvitation(
  title: string,
  templateId: string
): Promise<InvitationListItem> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new ValidationError('Judul undangan wajib diisi.');
  }

  if (trimmedTitle.length > 120) {
    throw new ValidationError('Judul undangan maksimal 120 karakter.');
  }

  const trimmedTemplateId = templateId.trim();
  if (!trimmedTemplateId) {
    throw new ValidationError('Silakan pilih salah satu template yang tersedia.');
  }

  // Otoritas user_id berasal dari sesi autentikasi Supabase, bukan dari form client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Sesi pengguna tidak valid. Silakan masuk kembali.');
  }

  // 1. Buat slug URL-safe
  const slug = generateSlug(trimmedTitle);

  // 2. Simpan draft undangan ke Supabase
  const { data: newInvitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      user_id: user.id,
      template_id: trimmedTemplateId,
      title: trimmedTitle,
      slug,
      status: 'draft',
    })
    .select('id, slug, title, event_type, status, created_at, updated_at')
    .single();

  if (insertError) {
    // Penanganan tabrakan slug (unique constraint violation 23505)
    if (insertError.code === '23505') {
      const fallbackSlug = `${generateSlug(trimmedTitle)}-${Date.now().toString(36).slice(-4)}`;
      const { data: retryInv, error: retryError } = await supabase
        .from('invitations')
        .insert({
          user_id: user.id,
          template_id: trimmedTemplateId,
          title: trimmedTitle,
          slug: fallbackSlug,
          status: 'draft',
        })
        .select('id, slug, title, event_type, status, created_at, updated_at')
        .single();

      if (retryError) {
        throw new DatabaseError('Gagal membuat draft undangan.', retryError);
      }
      return retryInv;
    }
    throw new DatabaseError('Gagal membuat draft undangan.', insertError);
  }

  return newInvitation;
}

/**
 * Mengambil daftar undangan milik pengguna saat ini (terisolasi otomatis oleh RLS).
 * Mengambil kolom utama serta relasi data konten dan galeri untuk visual preview card.
 */
export async function getMyInvitations(): Promise<InvitationListItem[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      slug,
      title,
      event_type,
      status,
      created_at,
      updated_at,
      data:invitation_data (
        content
      ),
      gallery:gallery_items (
        id,
        storage_path,
        thumbnail_path
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DatabaseError('Gagal memuat daftar undangan.', error);
  }

  return (data as unknown as InvitationListItem[]) ?? [];
}

/**
 * Mengambil detail undangan tunggal berdasarkan ID.
 * Akses diverifikasi oleh RLS sehingga hanya pemilik yang dapat membaca datanya.
 */
export async function getMyInvitationById(id: string): Promise<InvitationDetail | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, slug, title, event_type, template_id, status, allow_rsvp, show_wishes, theme_override, published_at, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat detail undangan.', error);
  }

  return data;
}

export interface UpdateInvitationCoreInput {
  title?: string;
  slug?: string;
  event_type?: string;
  allow_rsvp?: boolean;
  show_wishes?: boolean;
  theme_override?: import('@/types/database').Json;
}

/**
 * Memperbarui data inti undangan pada tabel invitations.
 * Ditegakkan secara otomatis oleh RLS (hanya pemilik sah yang dapat mengubah).
 */
export async function updateInvitationCore(
  id: string,
  updates: UpdateInvitationCoreInput
): Promise<InvitationDetail> {
  const payload: TablesUpdate<'invitations'> = {};

  if (updates.slug !== undefined) {
    const cleanSlug = updates.slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      throw new ValidationError(
        'Format slug harus berupa huruf kecil, angka, dan tanda hubung (-) dengan panjang 3 sampai 60 karakter.'
      );
    }
    payload.slug = cleanSlug;
  }

  if (updates.title !== undefined) {
    const cleanTitle = updates.title.trim();
    if (!cleanTitle) {
      throw new ValidationError('Judul undangan tidak boleh kosong.');
    }
    if (cleanTitle.length > 120) {
      throw new ValidationError('Judul undangan maksimal 120 karakter.');
    }
    payload.title = cleanTitle;
  }

  if (updates.event_type !== undefined) {
    const cleanEventType = updates.event_type.trim();
    if (cleanEventType) {
      payload.event_type = cleanEventType;
    }
  }

  if (updates.allow_rsvp !== undefined) {
    payload.allow_rsvp = Boolean(updates.allow_rsvp);
  }

  if (updates.show_wishes !== undefined) {
    payload.show_wishes = Boolean(updates.show_wishes);
  }

  if (updates.theme_override !== undefined) {
    payload.theme_override = updates.theme_override;
  }

  const { data, error } = await supabase
    .from('invitations')
    .update(payload)
    .eq('id', id)
    .select(
      'id, slug, title, event_type, template_id, status, allow_rsvp, show_wishes, theme_override, published_at, created_at, updated_at'
    )
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('Tautan (slug) undangan sudah digunakan oleh undangan lain. Silakan pilih slug lain.');
    }
    throw new DatabaseError('Gagal memperbarui data inti undangan.', error);
  }

  if (!data) {
    throw new AuthorizationError('Undangan tidak ditemukan atau Anda tidak memiliki izin untuk mengubahnya.');
  }

  return data;
}

export interface InvitationDataRecord {
  id: string;
  invitation_id: string;
  content: InvitationContent;
  updated_at: string;
}

/**
 * Mengambil data konten presentasi dari tabel invitation_data.
 */
export async function getInvitationData(
  invitationId: string
): Promise<InvitationDataRecord | null> {
  const { data, error } = await supabase
    .from('invitation_data')
    .select('id, invitation_id, content, updated_at')
    .eq('invitation_id', invitationId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat konten undangan.', error);
  }

  return (data as unknown as InvitationDataRecord) ?? null;
}

/**
 * Menyimpan atau memperbarui data konten presentasi pada tabel invitation_data.
 * Menggunakan upsert aman dengan constraint unik pada invitation_id.
 */
export async function upsertInvitationData(
  invitationId: string,
  content: InvitationContent | Record<string, unknown>
): Promise<InvitationDataRecord> {
  const { data, error } = await supabase
    .from('invitation_data')
    .upsert(
      {
        invitation_id: invitationId,
        content: content as import('@/types/database').Json,
      },
      { onConflict: 'invitation_id' }
    )
    .select('id, invitation_id, content, updated_at')
    .single();

  if (error) {
    throw new DatabaseError('Gagal menyimpan konten undangan.', error);
  }

  return data as unknown as InvitationDataRecord;
}

export interface InvitationSectionItem {
  id: string;
  invitation_id: string;
  section_type: string;
  variant: string;
  display_order: number;
  is_enabled: boolean;
  custom_config: import('@/types/database').Json;
}

/**
 * Mengambil daftar seksi undangan dari tabel invitation_sections terurut berdasarkan display_order.
 */
export async function getInvitationSections(
  invitationId: string
): Promise<InvitationSectionItem[]> {
  const { data, error } = await supabase
    .from('invitation_sections')
    .select('id, invitation_id, section_type, variant, display_order, is_enabled, custom_config')
    .eq('invitation_id', invitationId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat seksi undangan.', error);
  }

  return data ?? [];
}

/**
 * Mengubah status aktif/nonaktif sebuah seksi undangan pada tabel invitation_sections.
 */
export async function toggleInvitationSection(
  sectionId: string,
  isEnabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('invitation_sections')
    .update({ is_enabled: isEnabled })
    .eq('id', sectionId);

  if (error) {
    throw new DatabaseError('Gagal memperbarui status aktif seksi undangan.', error);
  }
}

/**
 * Memperbarui urutan display_order dan status is_enabled beberapa seksi undangan sekaligus.
 */
export async function updateInvitationSections(
  invitationId: string,
  sections: Array<{ id: string; display_order: number; is_enabled: boolean }>
): Promise<void> {
  const updates = sections.map((s) =>
    supabase
      .from('invitation_sections')
      .update({
        display_order: s.display_order,
        is_enabled: s.is_enabled,
      })
      .eq('id', s.id)
      .eq('invitation_id', invitationId)
  );

  const results = await Promise.all(updates);
  const failure = results.find((r) => r.error);
  if (failure?.error) {
    throw new DatabaseError('Gagal memperbarui urutan seksi undangan.', failure.error);
  }
}

/**
 * Menginisialisasi seksi undangan dari default_sections template master jika belum ada entri di database.
 * Memastikan ke-9 tipe seksi kanonikal (hero, couple/hosts, event/events, story, gallery, rsvp, wishes, gift, closing) tersedia.
 */
export async function initializeInvitationSectionsFromTemplate(
  invitationId: string,
  defaultSectionsRaw: unknown
): Promise<InvitationSectionItem[]> {
  const existing = await getInvitationSections(invitationId);
  if (existing.length > 0) {
    // Periksa apakah seksi 'wishes' sudah ada, jika belum tambahkan ke database
    const hasWishes = existing.some((s) => s.section_type === 'wishes');
    if (!hasWishes) {
      const maxOrder = existing.reduce((max, s) => Math.max(max, s.display_order), 0);
      const { data: newWishes } = await supabase
        .from('invitation_sections')
        .insert({
          invitation_id: invitationId,
          section_type: 'wishes',
          variant: 'default',
          display_order: maxOrder + 1,
          is_enabled: true,
          custom_config: {},
        })
        .select('id, invitation_id, section_type, variant, display_order, is_enabled, custom_config')
        .single();

      if (newWishes) {
        return [...existing, newWishes].sort((a, b) => a.display_order - b.display_order);
      }
    }
    return existing;
  }

  if (!Array.isArray(defaultSectionsRaw) || defaultSectionsRaw.length === 0) {
    return [];
  }

  interface RawSection {
    type?: string;
    order?: number;
    enabled?: boolean;
    variant?: string;
  }

  const baseRows = (defaultSectionsRaw as RawSection[])
    .filter((s) => typeof s?.type === 'string' && s.type.length > 0)
    .map((s, index) => ({
      invitation_id: invitationId,
      section_type: s.type as string,
      variant: typeof s.variant === 'string' ? s.variant : 'default',
      display_order: typeof s.order === 'number' ? s.order : index,
      is_enabled: typeof s.enabled === 'boolean' ? s.enabled : true,
      custom_config: {},
    }));

  // Jika seksi 'wishes' belum ada dalam default template, tambahkan
  if (!baseRows.some((s) => s.section_type === 'wishes')) {
    baseRows.push({
      invitation_id: invitationId,
      section_type: 'wishes',
      variant: 'default',
      display_order: baseRows.length,
      is_enabled: true,
      custom_config: {},
    });
  }

  const { data, error } = await supabase
    .from('invitation_sections')
    .insert(baseRows)
    .select('id, invitation_id, section_type, variant, display_order, is_enabled, custom_config')
    .order('display_order', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal menginisialisasi seksi undangan dari template.', error);
  }

  return data ?? [];
}

/**
 * Menghapus undangan milik pengguna.
 * Penghapusan divalidasi oleh database RLS (hanya pemilik yang dapat menghapus).
 */
export async function deleteMyInvitation(id: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new DatabaseError('Gagal menghapus undangan.', error);
  }
}

export interface InvitationEventItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  timezone: string;
  venue_name: string;
  address: string | null;
  maps_url: string | null;
  is_primary: boolean;
}

export interface InvitationGalleryItem {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  display_order: number;
  width: number | null;
  height: number | null;
}

/**
 * Mengambil daftar agenda acara untuk sebuah undangan terurut waktu.
 */
export async function getInvitationEvents(invitationId: string): Promise<InvitationEventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time, timezone, venue_name, address, maps_url, is_primary')
    .eq('invitation_id', invitationId)
    .order('start_time', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat agenda acara.', error);
  }

  return data ?? [];
}

/**
 * Menambahkan agenda acara baru untuk sebuah undangan.
 */
export async function createInvitationEvent(
  invitationId: string,
  event: {
    title: string;
    start_time: string;
    end_time?: string | null;
    timezone?: string;
    venue_name: string;
    address?: string | null;
    maps_url?: string | null;
    is_primary?: boolean;
  }
): Promise<InvitationEventItem> {
  const cleanTitle = event.title.trim();
  if (!cleanTitle) {
    throw new ValidationError('Nama acara wajib diisi.');
  }
  if (cleanTitle.length > 100) {
    throw new ValidationError('Nama acara maksimal 100 karakter.');
  }

  const cleanVenue = event.venue_name.trim();
  if (!cleanVenue) {
    throw new ValidationError('Nama tempat atau lokasi acara wajib diisi.');
  }

  if (event.maps_url && event.maps_url.trim()) {
    const cleanUrl = event.maps_url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      throw new ValidationError('Tautan Google Maps harus diawali dengan http:// atau https://');
    }
  }

  if (event.end_time && event.start_time) {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    if (end < start) {
      throw new ValidationError('Waktu selesai tidak boleh lebih awal dari waktu mulai acara.');
    }
  }

  // Jika dijadikan primary, nonaktifkan is_primary pada event lain terlebih dahulu
  if (event.is_primary) {
    await supabase
      .from('events')
      .update({ is_primary: false })
      .eq('invitation_id', invitationId);
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      invitation_id: invitationId,
      title: cleanTitle,
      start_time: event.start_time,
      end_time: event.end_time || null,
      timezone: event.timezone || 'Asia/Jakarta',
      venue_name: cleanVenue,
      address: event.address?.trim() || null,
      maps_url: event.maps_url?.trim() || null,
      is_primary: Boolean(event.is_primary),
    })
    .select('id, title, start_time, end_time, timezone, venue_name, address, maps_url, is_primary')
    .single();

  if (error) {
    throw new DatabaseError('Gagal menambahkan acara.', error);
  }

  return data;
}

/**
 * Memperbarui agenda acara yang ada.
 */
export async function updateInvitationEvent(
  eventId: string,
  invitationId: string,
  updates: {
    title?: string;
    start_time?: string;
    end_time?: string | null;
    timezone?: string;
    venue_name?: string;
    address?: string | null;
    maps_url?: string | null;
    is_primary?: boolean;
  }
): Promise<InvitationEventItem> {
  const payload: import('@/types/database').TablesUpdate<'events'> = {};

  if (updates.title !== undefined) {
    const cleanTitle = updates.title.trim();
    if (!cleanTitle) throw new ValidationError('Nama acara wajib diisi.');
    if (cleanTitle.length > 100) throw new ValidationError('Nama acara maksimal 100 karakter.');
    payload.title = cleanTitle;
  }

  if (updates.venue_name !== undefined) {
    const cleanVenue = updates.venue_name.trim();
    if (!cleanVenue) throw new ValidationError('Nama tempat atau lokasi acara wajib diisi.');
    payload.venue_name = cleanVenue;
  }

  if (updates.maps_url !== undefined) {
    if (updates.maps_url && updates.maps_url.trim()) {
      const cleanUrl = updates.maps_url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        throw new ValidationError('Tautan Google Maps harus diawali dengan http:// atau https://');
      }
      payload.maps_url = cleanUrl;
    } else {
      payload.maps_url = null;
    }
  }

  if (updates.start_time !== undefined) {
    payload.start_time = updates.start_time;
  }

  if (updates.end_time !== undefined) {
    payload.end_time = updates.end_time || null;
  }

  if (updates.timezone !== undefined) {
    payload.timezone = updates.timezone;
  }

  if (updates.address !== undefined) {
    payload.address = updates.address?.trim() || null;
  }

  if (updates.is_primary !== undefined) {
    if (updates.is_primary) {
      await supabase
        .from('events')
        .update({ is_primary: false })
        .eq('invitation_id', invitationId);
    }
    payload.is_primary = updates.is_primary;
  }

  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId)
    .eq('invitation_id', invitationId)
    .select('id, title, start_time, end_time, timezone, venue_name, address, maps_url, is_primary')
    .single();

  if (error) {
    throw new DatabaseError('Gagal memperbarui acara.', error);
  }

  return data;
}

/**
 * Menghapus agenda acara dari undangan.
 */
export async function deleteInvitationEvent(eventId: string, invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('invitation_id', invitationId);

  if (error) {
    throw new DatabaseError('Gagal menghapus acara.', error);
  }
}

/**
 * Mengambil daftar item galeri untuk sebuah undangan terurut berdasarkan display_order.
 */
export async function getInvitationGalleryItems(invitationId: string): Promise<InvitationGalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('id, storage_path, thumbnail_path, caption, display_order, width, height')
    .eq('invitation_id', invitationId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat galeri foto.', error);
  }

  return data ?? [];
}

export const INVITATION_GALLERY_BUCKET = 'invitation-gallery';
export const MAX_GALLERY_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_GALLERY_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Mengonversi path penyimpanan atau URL gambar menjadi URL publik yang dapat diakses browser.
 * Jika berkas tersimpan di Supabase Storage bucket 'invitation-gallery', fungsi ini
 * menghasilkan public URL secara deterministik tanpa request jaringan berulang (hemat egress).
 */
export function getGalleryPublicUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return '';
  const trimmed = storagePath.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const { data } = supabase.storage.from(INVITATION_GALLERY_BUCKET).getPublicUrl(trimmed);
  return data.publicUrl;
}

/**
 * Validasi ketat berkas foto sebelum proses pengunggahan.
 * Menolak format selain JPEG, PNG, dan WebP (termasuk SVG dan format non-image).
 * Membatasi ukuran berkas maksimal 5 MB per foto.
 */
export function validateGalleryImageFile(file: File): void {
  if (!file) {
    throw new ValidationError('Berkas foto tidak ditemukan.');
  }

  if (file.size > MAX_GALLERY_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `Ukuran berkas "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 5 MB.`
    );
  }

  if (!ALLOWED_GALLERY_MIME_TYPES.includes(file.type as (typeof ALLOWED_GALLERY_MIME_TYPES)[number])) {
    throw new ValidationError(
      `Format berkas "${file.name}" tidak didukung. Harap gunakan gambar berformat JPG, PNG, atau WebP.`
    );
  }

  const nameParts = file.name.split('.');
  const ext = (nameParts.length > 1 ? nameParts.pop() : '')?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'webp'];
  if (!ext || !validExts.includes(ext)) {
    throw new ValidationError(
      `Ekstensi berkas "${file.name}" tidak valid. Hanya ekstensi .jpg, .jpeg, .png, dan .webp yang diizinkan.`
    );
  }
}

/**
 * Ekstraksi dimensi gambar (width & height) secara aman di browser tanpa library eksternal.
 */
export function getBrowserImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.URL) {
      resolve({ width: 0, height: 0 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };

    img.src = objectUrl;
  });
}

/**
 * Mengunggah satu foto galeri ke Supabase Storage dengan struktur path tenant-safe:
 * {user_id}/{invitation_id}/{uuid}.{ext}
 *
 * Menjaga multi-tenant isolation dan prinsip atomik:
 * 1. Validasi sesi & berkas.
 * 2. Ekstraksi dimensi (width & height).
 * 3. Unggah ke storage bucket 'invitation-gallery'.
 * 4. Buat baris baru di tabel public.gallery_items.
 * 5. Rollback (hapus berkas di Storage) jika insert database gagal, mencegah orphan files.
 */
export async function uploadInvitationGalleryPhoto(
  invitationId: string,
  file: File,
  caption?: string | null,
  displayOrder?: number
): Promise<InvitationGalleryItem> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Sesi pengguna tidak valid. Silakan masuk kembali.');
  }

  validateGalleryImageFile(file);

  const { width, height } = await getBrowserImageDimensions(file);

  let ext = 'jpg';
  if (file.type === 'image/png') ext = 'png';
  else if (file.type === 'image/webp') ext = 'webp';
  else if (file.type === 'image/jpeg') ext = 'jpg';

  const fileId = crypto.randomUUID();
  const storagePath = `${user.id}/${invitationId}/${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(INVITATION_GALLERY_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    if (
      uploadError.message.includes('row-level security') ||
      uploadError.message.includes('unauthorized') ||
      (uploadError as { statusCode?: number }).statusCode === 403
    ) {
      throw new AuthorizationError('Anda tidak memiliki hak akses untuk mengunggah berkas ke undangan ini.');
    }
    throw new StorageError(
      'Gagal mengunggah foto ke penyimpanan. Silakan periksa koneksi internet Anda dan coba lagi.',
      uploadError
    );
  }

  const cleanCaption = caption?.trim() || null;
  const { data: itemData, error: insertError } = await supabase
    .from('gallery_items')
    .insert({
      invitation_id: invitationId,
      storage_path: storagePath,
      thumbnail_path: storagePath,
      caption: cleanCaption,
      display_order: typeof displayOrder === 'number' ? displayOrder : 0,
      width: width > 0 ? width : null,
      height: height > 0 ? height : null,
    })
    .select('id, storage_path, thumbnail_path, caption, display_order, width, height')
    .single();

  if (insertError) {
    // Rollback: bersihkan objek storage yang baru diunggah agar tidak meninggalkan orphan file
    try {
      await supabase.storage.from(INVITATION_GALLERY_BUCKET).remove([storagePath]);
    } catch {
      // Abaikan error pada rollback cleanup
    }
    throw new DatabaseError(
      'Gagal menyimpan data foto ke galeri. Berkas telah dibersihkan secara otomatis.',
      insertError
    );
  }

  return itemData;
}

/**
 * Menambahkan item foto baru ke galeri undangan secara langsung lewat path/URL.
 */
export async function createInvitationGalleryItem(
  invitationId: string,
  item: {
    storage_path: string;
    thumbnail_path?: string | null;
    caption?: string | null;
    display_order?: number;
    width?: number | null;
    height?: number | null;
  }
): Promise<InvitationGalleryItem> {
  const cleanPath = item.storage_path.trim();
  if (!cleanPath) {
    throw new ValidationError('Tautan atau jalur berkas foto wajib diisi.');
  }

  const cleanCaption = item.caption?.trim() || null;
  if (cleanCaption && cleanCaption.length > 200) {
    throw new ValidationError('Keterangan foto (caption) maksimal 200 karakter.');
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .insert({
      invitation_id: invitationId,
      storage_path: cleanPath,
      thumbnail_path: item.thumbnail_path?.trim() || cleanPath,
      caption: cleanCaption,
      display_order: typeof item.display_order === 'number' ? item.display_order : 0,
      width: item.width || null,
      height: item.height || null,
    })
    .select('id, storage_path, thumbnail_path, caption, display_order, width, height')
    .single();

  if (error) {
    throw new DatabaseError('Gagal menambahkan foto ke galeri.', error);
  }

  return data;
}

/**
 * Memperbarui keterangan atau urutan foto galeri tanpa perlu mengunggah ulang berkas.
 */
export async function updateInvitationGalleryItem(
  itemId: string,
  invitationId: string,
  updates: {
    caption?: string | null;
    display_order?: number;
  }
): Promise<InvitationGalleryItem> {
  const payload: import('@/types/database').TablesUpdate<'gallery_items'> = {};

  if (updates.caption !== undefined) {
    const cleanCaption = updates.caption?.trim() || null;
    if (cleanCaption && cleanCaption.length > 200) {
      throw new ValidationError('Keterangan foto (caption) maksimal 200 karakter.');
    }
    payload.caption = cleanCaption;
  }

  if (updates.display_order !== undefined) {
    payload.display_order = updates.display_order;
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .update(payload)
    .eq('id', itemId)
    .eq('invitation_id', invitationId)
    .select('id, storage_path, thumbnail_path, caption, display_order, width, height')
    .single();

  if (error) {
    throw new DatabaseError('Gagal memperbarui foto galeri.', error);
  }

  return data;
}

/**
 * Menghapus objek berkas fisik dari Supabase Storage bucket 'invitation-gallery'.
 */
export async function deleteGalleryImageFile(storagePath: string): Promise<void> {
  if (
    !storagePath ||
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('blob:') ||
    storagePath.startsWith('data:')
  ) {
    return;
  }

  const { error } = await supabase.storage
    .from(INVITATION_GALLERY_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new StorageError(
      'Gagal menghapus berkas foto dari penyimpanan. Silakan periksa koneksi internet Anda.',
      error
    );
  }
}

/**
 * Menghapus foto galeri secara menyeluruh:
 * 1. Ambil storage_path.
 * 2. Hapus database record gallery_items secara aman.
 * 3. Hapus berkas fisik di Supabase Storage.
 * 4. Tangani kegagalan storage secara eksplisit jika penghapusan berkas gagal.
 */
export async function deleteInvitationGalleryPhoto(
  item: InvitationGalleryItem,
  invitationId: string
): Promise<void> {
  const storagePath = item.storage_path;

  // 1. Hapus record metadata dari database terlebih dahulu
  const { error: dbError } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', item.id)
    .eq('invitation_id', invitationId);

  if (dbError) {
    throw new DatabaseError('Gagal menghapus data foto dari galeri.', dbError);
  }

  // 2. Hapus berkas fisik dari Supabase Storage
  try {
    await deleteGalleryImageFile(storagePath);
  } catch (storageError) {
    throw new StorageError(
      'Foto telah dihapus dari galeri, namun berkas di penyimpanan belum berhasil dibersihkan.',
      storageError
    );
  }
}

/**
 * Mengunggah foto profil mempelai atau host ke Supabase Storage.
 * Menggunakan bucket 'invitation-gallery' dengan subpath tenant-safe:
 * {userId}/{invitationId}/couple/{slot}-{fileId}.{ext}
 */
export async function uploadCouplePhoto(
  invitationId: string,
  file: File,
  slot: string = 'host'
): Promise<{ storage_path: string; photo_url: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Sesi pengguna tidak valid. Silakan masuk kembali.');
  }

  validateGalleryImageFile(file);

  let ext = 'jpg';
  if (file.type === 'image/png') ext = 'png';
  else if (file.type === 'image/webp') ext = 'webp';
  else if (file.type === 'image/jpeg') ext = 'jpg';

  const cleanSlot = slot.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'host';
  const fileId = crypto.randomUUID();
  const storagePath = `${user.id}/${invitationId}/couple/${cleanSlot}-${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(INVITATION_GALLERY_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    if (
      uploadError.message.includes('row-level security') ||
      uploadError.message.includes('unauthorized') ||
      (uploadError as { statusCode?: number }).statusCode === 403
    ) {
      throw new AuthorizationError('Anda tidak memiliki hak akses untuk mengunggah berkas ke undangan ini.');
    }
    throw new StorageError(
      'Gagal mengunggah foto mempelai ke penyimpanan. Silakan periksa koneksi dan coba lagi.',
      uploadError
    );
  }

  const photo_url = getGalleryPublicUrl(storagePath);
  return { storage_path: storagePath, photo_url };
}

/**
 * Alias domain function untuk mengunggah gambar galeri.
 */
export const uploadGalleryImage = uploadInvitationGalleryPhoto;

/**
 * Menghapus foto dari galeri undangan (kompatibilitas mundur dengan opsi hapus berkas storage).
 */
export async function deleteInvitationGalleryItem(
  itemId: string,
  invitationId: string,
  storagePath?: string | null
): Promise<void> {
  if (
    storagePath &&
    !storagePath.startsWith('http://') &&
    !storagePath.startsWith('https://') &&
    !storagePath.startsWith('blob:') &&
    !storagePath.startsWith('data:')
  ) {
    const { error: storageError } = await supabase.storage
      .from(INVITATION_GALLERY_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      throw new StorageError(
        'Gagal menghapus berkas foto dari penyimpanan. Operasi dibatalkan demi keamanan data.',
        storageError
      );
    }
  }

  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', itemId)
    .eq('invitation_id', invitationId);

  if (error) {
    throw new DatabaseError('Gagal menghapus foto dari galeri.', error);
  }
}

/**
 * Memperbarui urutan beberapa foto galeri sekaligus.
 */
export async function updateGalleryItemsOrder(
  invitationId: string,
  items: Array<{ id: string; display_order: number }>
): Promise<void> {
  const updates = items.map((i) =>
    supabase
      .from('gallery_items')
      .update({ display_order: i.display_order })
      .eq('id', i.id)
      .eq('invitation_id', invitationId)
  );

  const results = await Promise.all(updates);
  const failure = results.find((r) => r.error);
  if (failure?.error) {
    throw new DatabaseError('Gagal memperbarui urutan foto galeri.', failure.error);
  }
}

/**
 * Menormalisasi kontainer invitation_data (mendukung single object atau array 1-to-1).
 */
export function extractInvitationContent(
  rawData:
    | { content: import('@/types/database').Json }
    | Array<{ content: import('@/types/database').Json }>
    | null
    | undefined
): InvitationContent | null {
  if (!rawData) return null;
  if (Array.isArray(rawData)) {
    return (rawData[0]?.content as unknown as InvitationContent) ?? null;
  }
  return (rawData.content as unknown as InvitationContent) ?? null;
}

export interface InvitationTemplateConfig {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  status: string;
  allow_rsvp: boolean;
  show_wishes: boolean;
  theme_override: import('@/types/database').Json;
  template: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string;
    default_theme: import('@/types/database').Json;
    default_sections: import('@/types/database').Json;
  } | null;
  sections: Array<{
    id: string;
    section_type: string;
    variant: string;
    display_order: number;
    is_enabled: boolean;
    custom_config: import('@/types/database').Json;
  }>;
  data?:
    | { content: import('@/types/database').Json }
    | Array<{ content: import('@/types/database').Json }>
    | null;
  events?: InvitationEventItem[];
  gallery?: InvitationGalleryItem[];
}

/**
 * Mengambil konfigurasi template dan seksi undangan untuk perenderan (Template Engine).
 * Menjalankan satu query terkontrol dengan relasi terpadu via PostgREST untuk efisiensi egress.
 */
export async function getInvitationTemplateConfig(
  id: string
): Promise<InvitationTemplateConfig | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      slug,
      title,
      event_type,
      status,
      allow_rsvp,
      show_wishes,
      theme_override,
      template:templates (
        id,
        slug,
        name,
        category,
        description,
        default_theme,
        default_sections
      ),
      sections:invitation_sections (
        id,
        section_type,
        variant,
        display_order,
        is_enabled,
        custom_config
      ),
      data:invitation_data (
        content
      ),
      events:events (
        id,
        title,
        start_time,
        end_time,
        timezone,
        venue_name,
        address,
        maps_url,
        is_primary
      ),
      gallery:gallery_items (
        id,
        storage_path,
        thumbnail_path,
        caption,
        display_order,
        width,
        height
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat konfigurasi template undangan.', error);
  }

  return (data as unknown as InvitationTemplateConfig) ?? null;
}

export type PublishResult = Pick<Tables<'invitations'>, 'id' | 'status' | 'published_at'>;

/**
 * Mempublikasikan undangan (mengubah status menjadi 'published' dan mencatat timestamp published_at).
 * Memvalidasi kepemilikan, template aktif, serta data minimum (judul, slug, mempelai/host).
 * Hanya dapat dilakukan oleh pemilik sah yang terautentikasi (ditegakkan via auth session & RLS).
 */
export async function publishInvitation(id: string): Promise<PublishResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Sesi pengguna tidak valid. Silakan masuk kembali.');
  }

  // 1. Ambil data undangan beserta template dan konten untuk validasi prasyarat publikasi
  const { data: inv, error: fetchError } = await supabase
    .from('invitations')
    .select(`
      id,
      user_id,
      title,
      slug,
      template_id,
      template:templates (
        id,
        is_active
      ),
      data:invitation_data (
        content
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !inv) {
    throw new AuthorizationError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses.');
  }

  if (inv.user_id !== user.id) {
    throw new AuthorizationError('Anda tidak memiliki izin untuk mempublikasikan undangan ini.');
  }

  // 2. Validasi kelayakan data minimum
  const validationErrors: string[] = [];

  const cleanTitle = (inv.title || '').trim();
  if (cleanTitle.length === 0) {
    validationErrors.push('Judul undangan belum diisi.');
  }

  const cleanSlug = (inv.slug || '').trim().toLowerCase();
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
    validationErrors.push('Format tautan (slug) tidak valid (3 sampai 60 karakter, alfanumerik dan tanda hubung).');
  }

  interface TemplateCheck {
    id?: string;
    is_active?: boolean;
  }
  const tmpl = (Array.isArray(inv.template) ? inv.template[0] : inv.template) as TemplateCheck | null;
  if (!tmpl || tmpl.is_active !== true) {
    validationErrors.push('Template master yang dipilih tidak aktif atau tidak ditemukan.');
  }

  const content = extractInvitationContent(inv.data as { content: import('@/types/database').Json } | Array<{ content: import('@/types/database').Json }>);
  const hosts = Array.isArray(content?.hosts) ? content.hosts : [];
  const hasHost = hosts.some((h) => typeof h?.name === 'string' && h.name.trim().length > 0);
  if (!hasHost) {
    validationErrors.push('Setidaknya satu nama mempelai atau tuan rumah harus diisi sebelum mempublikasikan undangan.');
  }

  if (validationErrors.length > 0) {
    throw new ValidationError(validationErrors.join('\n'));
  }

  // 3. Eksekusi pembaruan status ke 'published'
  const { data, error } = await supabase
    .from('invitations')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status, published_at')
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal mempublikasikan undangan.', error);
  }

  if (!data) {
    throw new AuthorizationError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses.');
  }

  return data;
}

/**
 * Mengembalikan undangan ke status draf (unpublish).
 * Hanya dapat dilakukan oleh pemilik sah yang terautentikasi (ditegakkan via auth session & RLS).
 */
export async function unpublishInvitation(id: string): Promise<PublishResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Sesi pengguna tidak valid. Silakan masuk kembali.');
  }

  const { data, error } = await supabase
    .from('invitations')
    .update({
      status: 'draft',
      published_at: null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status, published_at')
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal mengubah status undangan menjadi draf.', error);
  }

  if (!data) {
    throw new AuthorizationError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses.');
  }

  return data;
}

export interface PublicInvitationPayload {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  status: string;
  allow_rsvp: boolean;
  show_wishes: boolean;
  theme_override: import('@/types/database').Json;
  template: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string;
    default_theme: import('@/types/database').Json;
    default_sections: import('@/types/database').Json;
  } | null;
  sections: Array<{
    id: string;
    section_type: string;
    variant: string;
    display_order: number;
    is_enabled: boolean;
    custom_config: import('@/types/database').Json;
  }>;
  data?:
    | { content: import('@/types/database').Json }
    | Array<{ content: import('@/types/database').Json }>
    | null;
  events?: InvitationEventItem[];
  gallery?: InvitationGalleryItem[];
}

/**
 * Mengambil undangan publik berdasarkan slug (hanya undangan dengan status 'published').
 * Menggunakan client publik Supabase (anon key) dan mengandalkan RLS.
 * Tidak mengambil user_id, private guest, atau data RSVP.
 * Menggunakan 1 query relasional untuk efisiensi egress.
 */
export async function getPublicInvitationBySlug(
  slug: string
): Promise<PublicInvitationPayload | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      slug,
      title,
      event_type,
      status,
      allow_rsvp,
      show_wishes,
      theme_override,
      template:templates (
        id,
        slug,
        name,
        category,
        description,
        default_theme,
        default_sections
      ),
      sections:invitation_sections (
        id,
        section_type,
        variant,
        display_order,
        is_enabled,
        custom_config
      ),
      data:invitation_data (
        content
      ),
      events:events (
        id,
        title,
        start_time,
        end_time,
        timezone,
        venue_name,
        address,
        maps_url,
        is_primary
      ),
      gallery:gallery_items (
        id,
        storage_path,
        thumbnail_path,
        caption,
        display_order,
        width,
        height
      )
    `)
    .eq('slug', cleanSlug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat undangan publik.', error);
  }

  return (data as unknown as PublicInvitationPayload) ?? null;
}

