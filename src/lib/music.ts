import { ValidationError } from '@/lib/errors';
import type { InvitationContentMusic } from '@/lib/template/types';
import { isValidWebUrl } from '@/lib/urls';

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
 * Menggunakan helper URL terpadu yang mematuhi standar keamanan ketat.
 */
export const isValidAudioUrl = isValidWebUrl;

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
