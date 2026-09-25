import { describe, expect, it } from 'vitest';
import {
  normalizeSectionType,
  getSectionComponent,
  getRegisteredSection,
} from '@/lib/template/SectionRegistry';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { extractInvitationContent } from '@/lib/invitations';
import { validateCoverConfig, DEFAULT_COVER_CONFIG } from '@/lib/cover';
import { validateMusicConfig, DEFAULT_MUSIC_CONFIG } from '@/lib/music';
import { normalizeGuestSlug } from '@/lib/guests';
import type { SectionConfig } from '@/lib/template/types';

/**
 * End-to-End Lifecycle & Consistency Audit Suite
 *
 * Memverifikasi integritas arsitektur data flow Aurovia:
 * 1. Resolusi seksi dan alias (database -> registry -> renderer)
 * 2. Ekstraksi konten presentasi (invitation_data JSONB -> typed InvitationContent)
 * 3. Validasi aturan publikasi dan prasyarat formulir
 * 4. Normalisasi slug tamu dan isolasi data privat
 * 5. Sanitasi konfigurasi media (cover & music)
 */

describe('Audit Alur Seksi & Resolusi Alias', () => {
  it('memetakan alias database secara kanonikal ke komponen terdaftar', () => {
    expect(normalizeSectionType('hosts')).toBe('couple');
    expect(normalizeSectionType('events')).toBe('event');
    expect(normalizeSectionType('hero')).toBe('hero');
    expect(normalizeSectionType('gallery')).toBe('gallery');
    expect(normalizeSectionType('rsvp')).toBe('rsvp');
    expect(normalizeSectionType('wishes')).toBe('wishes');
    expect(normalizeSectionType('gift')).toBe('gift');
    expect(normalizeSectionType('closing')).toBe('closing');
  });

  it('mengembalikan komponen renderer resmi untuk seluruh 9 tipe seksi kanonikal', () => {
    const canonicalTypes = [
      'hero',
      'couple',
      'event',
      'story',
      'gallery',
      'rsvp',
      'wishes',
      'gift',
      'closing',
    ];

    for (const type of canonicalTypes) {
      const section = getRegisteredSection(type);
      expect(section).toBeDefined();
      expect(section?.type).toBe(type);

      const Component = getSectionComponent(type);
      expect(Component).toBeDefined();
      expect(typeof Component).toBe('function');
    }
  });

  it('mengembalikan komponen melalui alias database (hosts dan events)', () => {
    const hostsComponent = getSectionComponent('hosts');
    const coupleComponent = getSectionComponent('couple');
    expect(hostsComponent).toBe(coupleComponent);

    const eventsComponent = getSectionComponent('events');
    const eventComponent = getSectionComponent('event');
    expect(eventsComponent).toBe(eventComponent);
  });

  it('menyelesaikan urutan dan status seksi custom terhadap default template', () => {
    const customSections: SectionConfig[] = [
      { id: 'sec-1', section_type: 'hero', variant: 'editorial', display_order: 0, is_enabled: true },
      { id: 'sec-2', section_type: 'hosts', variant: 'cards', display_order: 1, is_enabled: false },
      { id: 'sec-3', section_type: 'events', variant: 'cards', display_order: 2, is_enabled: true },
    ];

    const { sections } = resolveTemplateConfig({
      defaultThemeRaw: {},
      defaultSectionsRaw: [],
      invitationSections: customSections,
    });

    expect(sections).toHaveLength(2); // sec-2 dinonaktifkan sehingga hanya 2 yang aktif
    expect(sections[0]?.section_type).toBe('hero');
    expect(sections[1]?.section_type).toBe('events');
  });
});

describe('Audit Ekstraksi Konten Presentasi (invitation_data)', () => {
  it('mengekstrak data JSONB mentah menjadi struktur InvitationContent yang aman', () => {
    const rawData = {
      content: {
        hero: {
          headline: 'Pernikahan Sarah & Rizky',
          opening_text: 'Dengan memohon rahmat Allah SWT',
          couple_names: 'Sarah & Rizky',
          location_short: 'Bandung, Jawa Barat',
        },
        hosts: [
          {
            name: 'Rizky Pratama',
            role: 'Mempelai Pria',
            parents: 'Putra Bpk. Pratama & Ibu Pratama',
            bio: 'Arsitek dan pemerhati seni.',
            photo_url: 'https://example.com/rizky.jpg',
          },
          {
            name: 'Sarah Putri',
            role: 'Mempelai Wanita',
            parents: 'Putri Bpk. Putri & Ibu Putri',
            bio: 'Dokter anak.',
            photo_url: 'https://example.com/sarah.jpg',
          },
        ],
        story: [
          {
            id: 'story-1',
            title: 'Pertemuan Pertama',
            date: '2020',
            description: 'Bertemu di perpustakaan kota.',
            display_order: 0,
            is_enabled: true,
          },
        ],
        closing_notes: 'Kehadiran dan doa restu Anda adalah kehormatan bagi kami.',
      },
    };

    const extracted = extractInvitationContent(rawData);
    expect(extracted).not.toBeNull();

    expect(extracted?.hero?.headline).toBe('Pernikahan Sarah & Rizky');
    expect(extracted?.hosts?.[0]?.name).toBe('Rizky Pratama');
    expect(extracted?.hosts?.[1]?.name).toBe('Sarah Putri');
    expect(extracted?.story?.[0]?.title).toBe('Pertemuan Pertama');
    expect(extracted?.closing_notes).toBe('Kehadiran dan doa restu Anda adalah kehormatan bagi kami.');
  });

  it('memberikan fallback aman jika content bernilai null atau rusak', () => {
    const extractedFromNull = extractInvitationContent(null);
    expect(extractedFromNull).toBeNull();

    const extractedFromEmpty = extractInvitationContent({ content: null });
    expect(extractedFromEmpty).toBeNull();
  });
});

describe('Audit Batasan Konfigurasi Media & Keamanan', () => {
  it('memvalidasi batas dan format cover envelope', () => {
    expect(DEFAULT_COVER_CONFIG.enabled).toBe(true);
    expect(DEFAULT_COVER_CONFIG.button_label).toBe('Buka Undangan');

    // Menolak background image URL yang tidak aman
    const unsafeConfig = {
      ...DEFAULT_COVER_CONFIG,
      background_image_url: 'javascript:alert(1)',
    };
    expect(() => validateCoverConfig(unsafeConfig)).toThrow();
  });

  it('memvalidasi batasan konfigurasi musik latar', () => {
    expect(DEFAULT_MUSIC_CONFIG.enabled).toBe(false);

    // Audio URL yang valid
    const validMusic = {
      ...DEFAULT_MUSIC_CONFIG,
      enabled: true,
      audio_url: 'https://example.com/song.mp3',
    };
    expect(() => validateMusicConfig(validMusic)).not.toThrow();

    // Menolak audio URL yang tidak aman
    const unsafeMusic = {
      ...DEFAULT_MUSIC_CONFIG,
      enabled: true,
      audio_url: 'file:///etc/passwd',
    };
    expect(() => validateMusicConfig(unsafeMusic)).toThrow();
  });
});

describe('Audit Normalisasi Tamu & Slug', () => {
  it('menormalisasi nama tamu menjadi slug ramah URL', () => {
    expect(normalizeGuestSlug('Budi Santoso & Keluarga')).toBe('budi-santoso-keluarga');
    expect(normalizeGuestSlug('Dr. H. Ahmad Dahlan, S.T.')).toBe('dr-h-ahmad-dahlan-s-t');
    expect(normalizeGuestSlug('   Spasi   Berlebih   ')).toBe('spasi-berlebih');
  });

  it('menghasilkan slug fallback jika input hanya karakter khusus', () => {
    const fallback = normalizeGuestSlug('!@#$%^&*()');
    expect(fallback).toBe('tamu');
  });
});
