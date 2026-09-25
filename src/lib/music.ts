import { ValidationError } from '@/lib/errors';
import type { InvitationContentMusic } from '@/lib/template/types';

/**
 * Nilai default konfigurasi pemutar musik latar
 */
export const DEFAULT_MUSIC_CONFIG: InvitationContentMusic = {
  enabled: false,
  title: '',
  audio_url: '',
  autoplay: true,
  loop: true,
  volume: 0.5,
};

/**
 * Memvalidasi apakah URL audio aman dan valid untuk streaming latar.
 * Aturan keamanan:
 * - Hanya mengizinkan protokol http:// atau https://
 * - Menolak mutlak skema javascript:, data:, blob:, file:, dsb.
 * - Menolak URL yang mengandung kredensial sensitif (user:pass@)
 * - Panjang maksimum 2000 karakter
 */
export function isValidAudioUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2000) return false;

  // Cek skema berbahaya
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:')
  ) {
    return false;
  }

  // Wajib protokol HTTP atau HTTPS
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    // Tolak jika URL memuat kredensial akun
    if (parsed.username || parsed.password) {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validasi ketat konfigurasi musik latar sebelum disimpan ke database.
 */
export function validateMusicConfig(config: Partial<InvitationContentMusic>): void {
  if (!config) {
    throw new ValidationError('Konfigurasi musik tidak boleh kosong.');
  }

  if (config.enabled) {
    if (!config.audio_url || !config.audio_url.trim()) {
      throw new ValidationError('Tautan audio (URL) wajib diisi jika fitur musik diaktifkan.');
    }

    if (!isValidAudioUrl(config.audio_url)) {
      throw new ValidationError(
        'Tautan audio tidak valid. Harap gunakan alamat URL yang diawali dengan http:// atau https:// dan tidak memuat skema berbahaya.'
      );
    }
  }

  if (config.title && config.title.trim().length > 100) {
    throw new ValidationError('Judul atau label lagu maksimal 100 karakter.');
  }

  if (typeof config.volume === 'number') {
    if (isNaN(config.volume) || config.volume < 0 || config.volume > 1) {
      throw new ValidationError('Tingkat volume harus berada di antara rentang 0.0 hingga 1.0.');
    }
  }

  if (typeof config.start_time === 'number') {
    if (isNaN(config.start_time) || config.start_time < 0) {
      throw new ValidationError('Waktu mulai audio tidak boleh bernilai negatif.');
    }
  }
}

/**
 * Normalisasi data konfigurasi musik dari format JSONB yang belum terverifikasi.
 */
export function sanitizeMusicConfig(raw: unknown): InvitationContentMusic {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_MUSIC_CONFIG };
  }

  const obj = raw as Record<string, unknown>;

  const rawUrl = typeof obj.audio_url === 'string' ? obj.audio_url.trim() : '';
  const isUrlValid = isValidAudioUrl(rawUrl);

  const rawVolume = typeof obj.volume === 'number' && !isNaN(obj.volume) ? obj.volume : 0.5;
  const clampedVolume = Math.max(0, Math.min(1, rawVolume));

  const rawTitle = typeof obj.title === 'string' ? obj.title.trim().slice(0, 100) : '';

  return {
    enabled: Boolean(obj.enabled) && isUrlValid,
    title: rawTitle || undefined,
    audio_url: rawUrl,
    autoplay: obj.autoplay !== false,
    loop: obj.loop !== false,
    volume: clampedVolume,
    start_time: typeof obj.start_time === 'number' && obj.start_time >= 0 ? obj.start_time : undefined,
    source_type: obj.source_type === 'storage' ? 'storage' : 'url',
  };
}
