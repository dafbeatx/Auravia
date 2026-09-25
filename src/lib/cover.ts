import { ValidationError } from '@/lib/errors';
import type { InvitationContentCover } from '@/lib/template/types';
import { isValidWebUrl } from '@/lib/urls';

/**
 * Konfigurasi default pembuka sampul undangan (Cover Envelope Experience).
 * Sesuai prinsip desain Aurovia: nama pasangan dan tanggal acara diambil
 * langsung dari data existing jika tidak ditentukan secara eksplisit.
 */
export const DEFAULT_COVER_CONFIG: InvitationContentCover = {
  enabled: true,
  eyebrow: 'The Wedding Of',
  title: '',
  subtitle: '',
  button_label: 'Buka Undangan',
  background_image_url: '',
  overlay_opacity: 0.4,
};

/**
 * Validasi ketat konfigurasi sampul undangan (Cover Envelope).
 * Aturan domain:
 * - title: 1 sampai 120 karakter (jika diisi)
 * - eyebrow: maksimal 80 karakter
 * - subtitle: maksimal 200 karakter
 * - button_label: 1 sampai 40 karakter
 * - background_image_url: kosong diperbolehkan, jika diisi hanya http/https, menolak skema berbahaya dan kredensial
 * - overlay_opacity: angka dalam rentang 0.0 sampai 1.0
 */
export function validateCoverConfig(config: Partial<InvitationContentCover>): void {
  if (!config) {
    throw new ValidationError('Konfigurasi cover tidak boleh kosong.');
  }

  // Validasi eyebrow (maksimal 80 karakter)
  if (config.eyebrow !== undefined && config.eyebrow !== null) {
    if (typeof config.eyebrow !== 'string') {
      throw new ValidationError('Eyebrow cover harus berupa teks.');
    }
    if (config.eyebrow.trim().length > 80) {
      throw new ValidationError('Eyebrow cover maksimal 80 karakter.');
    }
  }

  // Validasi title (1 sampai 120 karakter jika diisi)
  if (config.title !== undefined && config.title !== null && config.title.trim() !== '') {
    if (typeof config.title !== 'string') {
      throw new ValidationError('Judul cover harus berupa teks.');
    }
    const trimmedTitle = config.title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 120) {
      throw new ValidationError('Judul cover harus berada di antara rentang 1 sampai 120 karakter.');
    }
  }

  // Validasi subtitle (maksimal 200 karakter)
  if (config.subtitle !== undefined && config.subtitle !== null) {
    if (typeof config.subtitle !== 'string') {
      throw new ValidationError('Subjudul cover harus berupa teks.');
    }
    if (config.subtitle.trim().length > 200) {
      throw new ValidationError('Subjudul cover maksimal 200 karakter.');
    }
  }

  // Validasi button_label (1 sampai 40 karakter jika diisi)
  if (config.button_label !== undefined && config.button_label !== null) {
    if (typeof config.button_label !== 'string') {
      throw new ValidationError('Label tombol cover harus berupa teks.');
    }
    const trimmedBtn = config.button_label.trim();
    if (trimmedBtn.length < 1 || trimmedBtn.length > 40) {
      throw new ValidationError('Label tombol cover harus berada di antara rentang 1 sampai 40 karakter.');
    }
  }

  // Validasi background_image_url (hanya http/https valid tanpa skema berbahaya)
  if (config.background_image_url && config.background_image_url.trim()) {
    if (!isValidWebUrl(config.background_image_url)) {
      throw new ValidationError(
        'Tautan gambar latar cover tidak valid. Gunakan alamat URL berprotokol http:// atau https:// tanpa skema berbahaya.'
      );
    }
  }

  // Validasi overlay_opacity (rentang 0.0 sampai 1.0)
  if (config.overlay_opacity !== undefined && config.overlay_opacity !== null) {
    if (
      typeof config.overlay_opacity !== 'number' ||
      isNaN(config.overlay_opacity) ||
      config.overlay_opacity < 0 ||
      config.overlay_opacity > 1
    ) {
      throw new ValidationError('Tingkat opasitas overlay cover harus berada di antara rentang 0.0 sampai 1.0.');
    }
  }
}

/**
 * Normalisasi data konfigurasi sampul dari format JSONB mentah yang belum terverifikasi.
 */
export function sanitizeCoverConfig(raw: unknown): InvitationContentCover {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_COVER_CONFIG };
  }

  const obj = raw as Record<string, unknown>;

  const rawBgUrl = typeof obj.background_image_url === 'string' ? obj.background_image_url.trim() : '';
  const isBgValid = isValidWebUrl(rawBgUrl);

  const rawOpacity =
    typeof obj.overlay_opacity === 'number' && !isNaN(obj.overlay_opacity)
      ? obj.overlay_opacity
      : 0.4;
  const clampedOpacity = Math.max(0, Math.min(1, rawOpacity));

  const rawEyebrow = typeof obj.eyebrow === 'string' ? obj.eyebrow.trim().slice(0, 80) : undefined;
  const rawTitle = typeof obj.title === 'string' ? obj.title.trim().slice(0, 120) : undefined;
  const rawSubtitle = typeof obj.subtitle === 'string' ? obj.subtitle.trim().slice(0, 200) : undefined;
  const rawButtonLabel =
    typeof obj.button_label === 'string' && obj.button_label.trim().length > 0
      ? obj.button_label.trim().slice(0, 40)
      : 'Buka Undangan';

  return {
    enabled: obj.enabled !== false, // default aktif
    eyebrow: rawEyebrow || 'The Wedding Of',
    title: rawTitle || undefined,
    subtitle: rawSubtitle || undefined,
    button_label: rawButtonLabel,
    background_image_url: isBgValid ? rawBgUrl : undefined,
    overlay_opacity: clampedOpacity,
  };
}
