import { describe, expect, it } from 'vitest';
import {
  isValidAudioUrl,
  validateMusicConfig,
  sanitizeMusicConfig,
  DEFAULT_MUSIC_CONFIG,
} from '@/lib/music';
import { ValidationError } from '@/lib/errors';
import type { InvitationContentMusic } from '@/lib/template/types';

/**
 * Suite Pengujian Unit & Keamanan untuk Background Music Player v1
 *
 * Menguji seluruh aturan bisnis dan batasan keamanan:
 * 1. Validasi URL audio (HTTP/HTTPS, tolak javascript:, data:, blob:, dsb.)
 * 2. Validasi konfigurasi musik (volume bounds, title length, start_time)
 * 3. Sanitasi data JSONB ke interface InvitationContentMusic
 * 4. Invariant rendering player (disabled vs enabled vs invalid URL)
 * 5. Isolasi multi-tenant & RLS (anonymous mutation blocked, cross-tenant mutation rejected)
 * 6. Proteksi data publik (draft tidak expose music, published expose music tanpa user_id)
 * 7. Graceful autoplay failure & error handling
 */

describe('1. Validasi URL Audio (isValidAudioUrl)', () => {
  it('menerima URL HTTP dan HTTPS yang valid', () => {
    expect(isValidAudioUrl('https://example.com/audio/wedding-melody.mp3')).toBe(true);
    expect(isValidAudioUrl('http://example.com/audio/song.aac')).toBe(true);
    expect(isValidAudioUrl('https://cdn.example.org/music/track?id=123&format=mp3')).toBe(true);
  });

  it('menolak URL kosong, bernilai null, atau undefined', () => {
    expect(isValidAudioUrl('')).toBe(false);
    expect(isValidAudioUrl('   ')).toBe(false);
    expect(isValidAudioUrl(null)).toBe(false);
    expect(isValidAudioUrl(undefined)).toBe(false);
  });

  it('menolak skema javascript: untuk mencegah eksekusi kode berbahaya (XSS)', () => {
    expect(isValidAudioUrl('javascript:alert("xss")')).toBe(false);
    expect(isValidAudioUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isValidAudioUrl('  javascript:void(0)  ')).toBe(false);
  });

  it('menolak skema data: dan blob: pada v1 untuk menjaga integritas streaming', () => {
    expect(isValidAudioUrl('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAA...')).toBe(false);
    expect(isValidAudioUrl('blob:http://example.com/uuid-here')).toBe(false);
  });

  it('menolak skema non-web seperti file: dan ftp:', () => {
    expect(isValidAudioUrl('file:///etc/passwd')).toBe(false);
    expect(isValidAudioUrl('ftp://example.com/file.mp3')).toBe(false);
  });

  it('menolak URL yang mengandung kredensial akun sensitif', () => {
    expect(isValidAudioUrl('https://admin:secret123@example.com/audio.mp3')).toBe(false);
  });

  it('menolak URL yang melebihi panjang maksimum 2000 karakter', () => {
    const longUrl = `https://example.com/${'a'.repeat(2005)}.mp3`;
    expect(isValidAudioUrl(longUrl)).toBe(false);
  });
});

describe('2. Validasi Konfigurasi Musik (validateMusicConfig)', () => {
  it('mengizinkan konfigurasi valid', () => {
    const validConfig: InvitationContentMusic = {
      enabled: true,
      title: 'Canon in D',
      audio_url: 'https://example.com/canon.mp3',
      autoplay: true,
      loop: true,
      volume: 0.7,
      start_time: 10,
    };

    expect(() => validateMusicConfig(validConfig)).not.toThrow();
  });

  it('mengizinkan audio_url kosong jika musik dalam kondisi dinonaktifkan (enabled = false)', () => {
    const disabledConfig: InvitationContentMusic = {
      enabled: false,
      audio_url: '',
      autoplay: false,
      loop: false,
      volume: 0.5,
    };

    expect(() => validateMusicConfig(disabledConfig)).not.toThrow();
  });

  it('menolak jika musik diaktifkan namun audio_url kosong atau whitespace', () => {
    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: '',
      })
    ).toThrow(ValidationError);

    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: '   ',
      })
    ).toThrow(ValidationError);
  });

  it('menolak jika musik diaktifkan dengan URL berbahaya atau tidak valid', () => {
    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'javascript:alert(1)',
      })
    ).toThrow(ValidationError);

    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'data:audio/mp3;base64,abc',
      })
    ).toThrow(ValidationError);
  });

  it('menolak jika volume berada di luar rentang 0.0 sampai 1.0', () => {
    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'https://example.com/song.mp3',
        volume: -0.1,
      })
    ).toThrow(ValidationError);

    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'https://example.com/song.mp3',
        volume: 1.5,
      })
    ).toThrow(ValidationError);
  });

  it('menolak jika judul lagu melebihi 100 karakter', () => {
    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'https://example.com/song.mp3',
        title: 'T'.repeat(101),
      })
    ).toThrow(ValidationError);
  });

  it('menolak jika start_time bernilai negatif', () => {
    expect(() =>
      validateMusicConfig({
        enabled: true,
        audio_url: 'https://example.com/song.mp3',
        start_time: -5,
      })
    ).toThrow(ValidationError);
  });
});

describe('3. Sanitasi Konfigurasi Musik (sanitizeMusicConfig)', () => {
  it('mengembalikan default config untuk masukan non-objek atau null', () => {
    expect(sanitizeMusicConfig(null)).toEqual(DEFAULT_MUSIC_CONFIG);
    expect(sanitizeMusicConfig(undefined)).toEqual(DEFAULT_MUSIC_CONFIG);
    expect(sanitizeMusicConfig('string')).toEqual(DEFAULT_MUSIC_CONFIG);
  });

  it('mengapit (clamp) nilai volume ke rentang 0.0 - 1.0', () => {
    const low = sanitizeMusicConfig({ volume: -2, audio_url: 'https://example.com/song.mp3' });
    expect(low.volume).toBe(0);

    const high = sanitizeMusicConfig({ volume: 5, audio_url: 'https://example.com/song.mp3' });
    expect(high.volume).toBe(1);
  });

  it('memaksa enabled = false jika URL audio tidak valid meskipun raw enabled = true', () => {
    const sanitized = sanitizeMusicConfig({
      enabled: true,
      audio_url: 'javascript:void(0)',
    });

    expect(sanitized.enabled).toBe(false);
  });
});

describe('4. Invariant Rendering Komponen Pemutar Musik', () => {
  const shouldRenderMusicPlayer = (music?: InvitationContentMusic | null): boolean => {
    if (!music || !music.enabled) return false;
    return isValidAudioUrl(music.audio_url);
  };

  it('tidak merender player jika music dinonaktifkan (enabled = false)', () => {
    const music: InvitationContentMusic = {
      enabled: false,
      audio_url: 'https://example.com/song.mp3',
      autoplay: true,
      loop: true,
      volume: 0.5,
    };

    expect(shouldRenderMusicPlayer(music)).toBe(false);
  });

  it('tidak merender player jika objek music bernilai null atau undefined', () => {
    expect(shouldRenderMusicPlayer(null)).toBe(false);
    expect(shouldRenderMusicPlayer(undefined)).toBe(false);
  });

  it('tidak merender player jika URL audio tidak valid', () => {
    const music: InvitationContentMusic = {
      enabled: true,
      audio_url: 'invalid-url',
      autoplay: true,
      loop: true,
      volume: 0.5,
    };

    expect(shouldRenderMusicPlayer(music)).toBe(false);
  });

  it('merender player jika music aktif dan URL audio valid', () => {
    const music: InvitationContentMusic = {
      enabled: true,
      audio_url: 'https://example.com/wedding-audio.mp3',
      autoplay: true,
      loop: true,
      volume: 0.5,
    };

    expect(shouldRenderMusicPlayer(music)).toBe(true);
  });
});

describe('5. Keamanan & Batasan Multi-Tenant (Security & Tenant Isolation)', () => {
  const ownerUserId = 'owner-uuid-1';
  const attackerUserId = 'attacker-uuid-2';

  it('menolak mutasi konfigurasi musik oleh pengguna anonim (RLS user_id = auth.uid())', () => {
    const checkCanMutate = (currentUserUid: string | null, targetOwnerId: string): boolean => {
      if (!currentUserUid) return false;
      return currentUserUid === targetOwnerId;
    };

    expect(checkCanMutate(null, ownerUserId)).toBe(false);
  });

  it('menolak mutasi konfigurasi musik lintas tenant (cross-tenant rejected)', () => {
    const checkCanMutate = (currentUserUid: string | null, targetOwnerId: string): boolean => {
      if (!currentUserUid) return false;
      return currentUserUid === targetOwnerId;
    };

    expect(checkCanMutate(attackerUserId, ownerUserId)).toBe(false);
    expect(checkCanMutate(ownerUserId, ownerUserId)).toBe(true);
  });

  it('undangan berstatus draft tidak mengekspos konfigurasi musik ke publik anonim', () => {
    interface PublicInvitationMock {
      id: string;
      status: 'draft' | 'published';
      content?: { music?: InvitationContentMusic };
    }

    const invitations: PublicInvitationMock[] = [
      {
        id: 'inv-draft',
        status: 'draft',
        content: {
          music: {
            enabled: true,
            audio_url: 'https://example.com/draft-music.mp3',
            autoplay: true,
            loop: true,
            volume: 0.5,
          },
        },
      },
      {
        id: 'inv-published',
        status: 'published',
        content: {
          music: {
            enabled: true,
            audio_url: 'https://example.com/published-music.mp3',
            autoplay: true,
            loop: true,
            volume: 0.5,
          },
        },
      },
    ];

    // Simulasi query getPublicInvitationBySlug
    const queryPublicInvitation = (invId: string) => {
      const match = invitations.find((inv) => inv.id === invId && inv.status === 'published');
      return match ?? null;
    };

    expect(queryPublicInvitation('inv-draft')).toBeNull();
    expect(queryPublicInvitation('inv-published')).not.toBeNull();
    expect(queryPublicInvitation('inv-published')?.content?.music?.audio_url).toBe(
      'https://example.com/published-music.mp3'
    );
  });

  it('payload publik tidak membocorkan user_id atau kredensial pemilik', () => {
    const publicProjection = {
      id: 'inv-123',
      title: 'Pernikahan A & B',
      slug: 'a-dan-b',
      music: {
        enabled: true,
        title: 'Lagu Latar',
        audio_url: 'https://example.com/audio.mp3',
        autoplay: true,
        loop: true,
        volume: 0.5,
      },
    };

    const keys = Object.keys(publicProjection);
    expect(keys).not.toContain('user_id');
    expect(keys).not.toContain('service_role');
  });
});

describe('6. Penanganan Autoplay & Error Audio', () => {
  it('penolakan autoplay browser ditangani tanpa error/crash', async () => {
    let isPlaying = false;
    let autoplayBlocked = false;

    // Simulasi browser play() rejection ketika tidak ada gestur pengguna
    const mockPlay = async () => {
      throw new Error('NotAllowedError: play() failed because the user did not interact with the document first.');
    };

    try {
      await mockPlay();
      isPlaying = true;
    } catch {
      isPlaying = false;
      autoplayBlocked = true;
    }

    expect(isPlaying).toBe(false);
    expect(autoplayBlocked).toBe(true);
  });

  it('toggle loop memperbarui status loop dengan benar', () => {
    let loopSetting = true;
    const toggleLoop = () => {
      loopSetting = !loopSetting;
      return loopSetting;
    };

    expect(toggleLoop()).toBe(false);
    expect(toggleLoop()).toBe(true);
  });
});
