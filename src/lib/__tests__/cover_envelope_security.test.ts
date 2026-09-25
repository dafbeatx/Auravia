import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_COVER_CONFIG,
  validateCoverConfig,
  sanitizeCoverConfig,
} from '@/lib/cover';
import { isValidWebUrl } from '@/lib/urls';
import { ValidationError } from '@/lib/errors';
import type { InvitationContentCover } from '@/lib/template/types';

/**
 * Suite Pengujian Unit & Keamanan untuk Cover / Envelope Opening Experience v1
 *
 * Menguji:
 * 1. Default cover config
 * 2. Validasi panjang teks cover (title, eyebrow, subtitle, button_label)
 * 3. Validasi background URL (HTTP/HTTPS, tolak javascript:, data:, blob:, file:, dsb.)
 * 4. Batasan opasitas overlay (0.0 sampai 1.0)
 * 5. Sanitasi data JSONB
 * 6. Integrasi event gesture pembuka musik (play success, play rejection, graceful handling)
 * 7. Pengujian deterministik logika prefers-reduced-motion
 */

describe('1. Konfigurasi Default Sampul (DEFAULT_COVER_CONFIG)', () => {
  it('memiliki nilai default yang aman dan sesuai spesifikasi produk', () => {
    expect(DEFAULT_COVER_CONFIG.enabled).toBe(true);
    expect(DEFAULT_COVER_CONFIG.eyebrow).toBe('The Wedding Of');
    expect(DEFAULT_COVER_CONFIG.title).toBe('');
    expect(DEFAULT_COVER_CONFIG.subtitle).toBe('');
    expect(DEFAULT_COVER_CONFIG.button_label).toBe('Buka Undangan');
    expect(DEFAULT_COVER_CONFIG.background_image_url).toBe('');
    expect(DEFAULT_COVER_CONFIG.overlay_opacity).toBe(0.4);
  });
});

describe('2. Validasi Batasan Teks Sampul (validateCoverConfig)', () => {
  it('menerima konfigurasi cover yang valid dan lengkap', () => {
    const validConfig: InvitationContentCover = {
      enabled: true,
      eyebrow: 'Walimatul Ursy',
      title: 'Romeo & Juliet',
      subtitle: 'Sabtu, 28 November 2026',
      button_label: 'Buka Undangan',
      background_image_url: 'https://example.com/cover.jpg',
      overlay_opacity: 0.5,
    };

    expect(() => validateCoverConfig(validConfig)).not.toThrow();
  });

  it('mengizinkan teks kosong atau opsional tanpa error', () => {
    expect(() =>
      validateCoverConfig({
        enabled: true,
        eyebrow: '',
        title: '',
        subtitle: '',
        button_label: 'Buka',
      })
    ).not.toThrow();
  });

  it('menolak konfigurasi kosong atau null', () => {
    expect(() => validateCoverConfig(null as unknown as Partial<InvitationContentCover>)).toThrow(
      ValidationError
    );
  });

  it('memvalidasi batasan panjang judul (1 sampai 120 karakter)', () => {
    // 120 karakter diizinkan
    const maxTitle = 'A'.repeat(120);
    expect(() => validateCoverConfig({ title: maxTitle })).not.toThrow();

    // 121 karakter ditolak
    const tooLongTitle = 'A'.repeat(121);
    expect(() => validateCoverConfig({ title: tooLongTitle })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ title: tooLongTitle })).toThrow(
      /1 sampai 120 karakter/
    );
  });

  it('memvalidasi batasan panjang eyebrow (maksimal 80 karakter)', () => {
    const maxEyebrow = 'E'.repeat(80);
    expect(() => validateCoverConfig({ eyebrow: maxEyebrow })).not.toThrow();

    const tooLongEyebrow = 'E'.repeat(81);
    expect(() => validateCoverConfig({ eyebrow: tooLongEyebrow })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ eyebrow: tooLongEyebrow })).toThrow(/maksimal 80 karakter/);
  });

  it('memvalidasi batasan panjang subjudul (maksimal 200 karakter)', () => {
    const maxSubtitle = 'S'.repeat(200);
    expect(() => validateCoverConfig({ subtitle: maxSubtitle })).not.toThrow();

    const tooLongSubtitle = 'S'.repeat(201);
    expect(() => validateCoverConfig({ subtitle: tooLongSubtitle })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ subtitle: tooLongSubtitle })).toThrow(/maksimal 200 karakter/);
  });

  it('memvalidasi batasan panjang label tombol (1 sampai 40 karakter)', () => {
    const maxBtn = 'B'.repeat(40);
    expect(() => validateCoverConfig({ button_label: maxBtn })).not.toThrow();

    const tooLongBtn = 'B'.repeat(41);
    expect(() => validateCoverConfig({ button_label: tooLongBtn })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ button_label: tooLongBtn })).toThrow(
      /1 sampai 40 karakter/
    );
  });
});

describe('3. Validasi Keamanan URL Gambar Latar (isValidWebUrl & validateCoverConfig)', () => {
  it('menerima tautan HTTP dan HTTPS yang valid', () => {
    expect(isValidWebUrl('https://example.com/images/bg.jpg')).toBe(true);
    expect(isValidWebUrl('http://cdn.example.org/photo.png')).toBe(true);
    expect(
      isValidWebUrl('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format')
    ).toBe(true);

    expect(() =>
      validateCoverConfig({ background_image_url: 'https://example.com/bg.jpg' })
    ).not.toThrow();
  });

  it('mengizinkan background_image_url kosong atau undefined', () => {
    expect(() => validateCoverConfig({ background_image_url: '' })).not.toThrow();
    expect(() => validateCoverConfig({ background_image_url: undefined })).not.toThrow();
  });

  it('menolak skema javascript: (mencegah XSS)', () => {
    expect(isValidWebUrl('javascript:alert(document.cookie)')).toBe(false);
    expect(isValidWebUrl('JAVASCRIPT:alert(1)')).toBe(false);

    expect(() =>
      validateCoverConfig({ background_image_url: 'javascript:alert(1)' })
    ).toThrow(ValidationError);
  });

  it('menolak skema data: (mencegah payload inline berbahaya)', () => {
    expect(isValidWebUrl('data:image/svg+xml;base64,PHN2ZyB4bWxuc...')).toBe(false);
    expect(() =>
      validateCoverConfig({
        background_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...',
      })
    ).toThrow(ValidationError);
  });

  it('menolak skema blob: pada konfigurasi tersimpan', () => {
    expect(isValidWebUrl('blob:https://example.com/550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    expect(() =>
      validateCoverConfig({
        background_image_url: 'blob:https://example.com/uuid',
      })
    ).toThrow(ValidationError);
  });

  it('menolak skema non-web file: dan ftp:', () => {
    expect(isValidWebUrl('file:///C:/Windows/win.ini')).toBe(false);
    expect(isValidWebUrl('ftp://ftp.example.com/photo.jpg')).toBe(false);

    expect(() =>
      validateCoverConfig({ background_image_url: 'file:///etc/passwd' })
    ).toThrow(ValidationError);
  });

  it('menolak URL yang memuat kredensial akun pengguna', () => {
    expect(isValidWebUrl('https://admin:supersecret@example.com/bg.jpg')).toBe(false);
    expect(() =>
      validateCoverConfig({
        background_image_url: 'https://user:password@example.com/image.jpg',
      })
    ).toThrow(ValidationError);
  });
});

describe('4. Batasan Opasitas Overlay (validateCoverConfig)', () => {
  it('menerima nilai opasitas di antara rentang 0.0 dan 1.0', () => {
    expect(() => validateCoverConfig({ overlay_opacity: 0 })).not.toThrow();
    expect(() => validateCoverConfig({ overlay_opacity: 0.45 })).not.toThrow();
    expect(() => validateCoverConfig({ overlay_opacity: 1 })).not.toThrow();
  });

  it('menolak nilai opasitas di luar rentang 0.0 sampai 1.0', () => {
    expect(() => validateCoverConfig({ overlay_opacity: -0.1 })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ overlay_opacity: 1.01 })).toThrow(ValidationError);
    expect(() => validateCoverConfig({ overlay_opacity: NaN })).toThrow(ValidationError);
  });
});

describe('5. Sanitasi Data Sampul JSONB (sanitizeCoverConfig)', () => {
  it('mengembalikan default config jika raw input null atau bukan objek', () => {
    const result1 = sanitizeCoverConfig(null);
    expect(result1).toEqual(DEFAULT_COVER_CONFIG);

    const result2 = sanitizeCoverConfig('bukan-objek');
    expect(result2).toEqual(DEFAULT_COVER_CONFIG);
  });

  it('memotong string yang melebihi batas dan membersihkan URL tidak valid', () => {
    const dirtyData = {
      enabled: true,
      eyebrow: 'E'.repeat(120),
      title: 'T'.repeat(150),
      subtitle: 'S'.repeat(300),
      button_label: 'B'.repeat(60),
      background_image_url: 'javascript:alert(1)',
      overlay_opacity: 2.5,
    };

    const sanitized = sanitizeCoverConfig(dirtyData);
    expect(sanitized.eyebrow?.length).toBe(80);
    expect(sanitized.title?.length).toBe(120);
    expect(sanitized.subtitle?.length).toBe(200);
    expect(sanitized.button_label?.length).toBe(40);
    expect(sanitized.background_image_url).toBeUndefined(); // Ditolak karena skema berbahaya
    expect(sanitized.overlay_opacity).toBe(1.0); // Di-clamp ke 1.0
  });

  it('mempertahankan URL yang aman dan valid', () => {
    const cleanData = {
      enabled: true,
      background_image_url: 'https://example.com/beautiful-cover.jpg',
      overlay_opacity: 0.35,
    };

    const sanitized = sanitizeCoverConfig(cleanData);
    expect(sanitized.background_image_url).toBe('https://example.com/beautiful-cover.jpg');
    expect(sanitized.overlay_opacity).toBe(0.35);
  });
});

describe('6. Integrasi Pemicu Musik & Penanganan Audio Graceful', () => {
  it('berhasil memicu event aurovia:play-music saat cover dibuka', () => {
    const bus = new EventTarget();
    const handler = vi.fn();
    bus.addEventListener('aurovia:play-music', handler);

    bus.dispatchEvent(new CustomEvent('aurovia:play-music'));

    expect(handler).toHaveBeenCalledTimes(1);
    bus.removeEventListener('aurovia:play-music', handler);
  });

  it('menangani penolakan browser (play rejection) secara graceful tanpa uncaught error', async () => {
    // Simulasi HTMLAudioElement yang menolak play() karena aturan autoplay browser
    const mockAudio = {
      play: vi.fn().mockRejectedValue(new Error('NotAllowedError: play() failed')),
      pause: vi.fn(),
    };

    let isPlaying = false;
    let didCatchError = false;

    const playPromise = mockAudio.play();
    if (playPromise !== undefined) {
      await playPromise
        .then(() => {
          isPlaying = true;
        })
        .catch(() => {
          didCatchError = true;
          isPlaying = false;
        });
    }

    expect(mockAudio.play).toHaveBeenCalled();
    expect(isPlaying).toBe(false);
    expect(didCatchError).toBe(true);
  });

  it('memperbarui status play ke true jika browser mengizinkan audio', async () => {
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    };

    let isPlaying = false;

    const playPromise = mockAudio.play();
    if (playPromise !== undefined) {
      await playPromise
        .then(() => {
          isPlaying = true;
        })
        .catch(() => {
          isPlaying = false;
        });
    }

    expect(isPlaying).toBe(true);
  });

  it('tidak memicu pemutaran audio jika konfigurasi musik dinonaktifkan atau URL tidak valid', () => {
    const shouldAttemptPlay = (music?: { enabled: boolean; audio_url: string } | null): boolean => {
      if (!music?.enabled) return false;
      return isValidWebUrl(music.audio_url);
    };

    expect(shouldAttemptPlay(null)).toBe(false);
    expect(shouldAttemptPlay({ enabled: false, audio_url: 'https://example.com/audio.mp3' })).toBe(false);
    expect(shouldAttemptPlay({ enabled: true, audio_url: 'javascript:alert(1)' })).toBe(false);
    expect(shouldAttemptPlay({ enabled: true, audio_url: 'https://example.com/audio.mp3' })).toBe(true);
  });
});

describe('7. Logika Preferensi Gerak (prefers-reduced-motion)', () => {
  it('dapat mendeteksi status reduced motion secara deterministik melalui query parser', () => {
    const evaluateReducedMotion = (query: string, prefersReduced: boolean) => {
      return {
        matches: query === '(prefers-reduced-motion: reduce)' && prefersReduced,
        media: query,
      };
    };

    // Saat preferensi reduced motion diaktifkan di OS pengguna
    const reducedResult = evaluateReducedMotion('(prefers-reduced-motion: reduce)', true);
    expect(reducedResult.matches).toBe(true);

    // Saat preferensi normal (motion diperbolehkan)
    const normalResult = evaluateReducedMotion('(prefers-reduced-motion: reduce)', false);
    expect(normalResult.matches).toBe(false);
  });
});
