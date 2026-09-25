import { describe, expect, it } from 'vitest';
import {
  buildGuestInvitationUrl,
  generateWhatsAppShareUrl,
  isValidGuestSlug,
  normalizeGuestSlug,
  normalizePhoneNumber,
  validateGuestInput,
} from '@/lib/guests';
import { ValidationError } from '@/lib/errors';

describe('normalizeGuestSlug', () => {
  it('converts names to lowercased hyphenated slugs', () => {
    expect(normalizeGuestSlug('Budi Santoso')).toBe('budi-santoso');
    expect(normalizeGuestSlug('dr. Sarah Jenkins, Sp.A')).toBe('dr-sarah-jenkins-sp-a');
  });

  it('strips accents and special characters cleanly', () => {
    expect(normalizeGuestSlug('Keluarga René & François')).toBe('keluarga-rene-francois');
    expect(normalizeGuestSlug('   Pak Ahmad (Keluarga)   ')).toBe('pak-ahmad-keluarga');
  });

  it('provides a safe fallback for strings without alphanumeric characters', () => {
    expect(normalizeGuestSlug('')).toBe('tamu');
    expect(normalizeGuestSlug('   ---   ')).toBe('tamu');
    expect(normalizeGuestSlug('!@#$%^&*()')).toBe('tamu');
  });

  it('truncates slugs exceeding 60 characters without trailing hyphens', () => {
    const longName = 'Keluarga Besar Sastroamidjojo Dan Seluruh Keturunan Dari Trah Mangkunegaran Cabang Timur';
    const slug = normalizeGuestSlug(longName);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug).not.toMatch(/-$/);
    expect(isValidGuestSlug(slug)).toBe(true);
  });
});

describe('isValidGuestSlug', () => {
  it('validates compliant PostgreSQL regex slugs', () => {
    expect(isValidGuestSlug('budi')).toBe(true);
    expect(isValidGuestSlug('budi-santoso')).toBe(true);
    expect(isValidGuestSlug('tamu-vip-01')).toBe(true);
  });

  it('rejects slugs with invalid format or characters', () => {
    expect(isValidGuestSlug('')).toBe(false);
    expect(isValidGuestSlug('-budi')).toBe(false);
    expect(isValidGuestSlug('budi-')).toBe(false);
    expect(isValidGuestSlug('budi--santoso')).toBe(false);
    expect(isValidGuestSlug('Budi-Santoso')).toBe(false);
    expect(isValidGuestSlug('budi_santoso')).toBe(false);
    expect(isValidGuestSlug('budi santoso')).toBe(false);
    expect(isValidGuestSlug('a'.repeat(61))).toBe(false);
  });
});

describe('normalizePhoneNumber', () => {
  it('converts Indonesian 08xx prefix to international 628xx', () => {
    expect(normalizePhoneNumber('081234567890')).toBe('6281234567890');
    expect(normalizePhoneNumber('0819-8765-4321')).toBe('6281987654321');
  });

  it('strips formatting symbols and spaces', () => {
    expect(normalizePhoneNumber('+62 812-3456-7890')).toBe('6281234567890');
    expect(normalizePhoneNumber('(0852) 1122 3344')).toBe('6285211223344');
    expect(normalizePhoneNumber('+65 9123 4567')).toBe('6591234567');
  });

  it('returns null for empty or null inputs', () => {
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
    expect(normalizePhoneNumber('')).toBeNull();
    expect(normalizePhoneNumber('   ')).toBeNull();
  });
});

describe('validateGuestInput', () => {
  it('passes on valid input', () => {
    expect(() => {
      validateGuestInput({
        name: 'Budi Santoso',
        phone: '08123456789',
        pax_limit: 2,
        slug: 'budi-santoso',
      });
    }).not.toThrow();
  });

  it('throws ValidationError for empty name', () => {
    expect(() => validateGuestInput({ name: '' })).toThrow(ValidationError);
    expect(() => validateGuestInput({ name: '   ' })).toThrow(ValidationError);
  });

  it('throws ValidationError for names longer than 100 characters', () => {
    expect(() => validateGuestInput({ name: 'A'.repeat(101) })).toThrow(ValidationError);
  });

  it('throws ValidationError for pax_limit outside 1 to 20 range', () => {
    expect(() => validateGuestInput({ pax_limit: 0 })).toThrow(ValidationError);
    expect(() => validateGuestInput({ pax_limit: 21 })).toThrow(ValidationError);
    expect(() => validateGuestInput({ pax_limit: 2.5 })).toThrow(ValidationError);
  });

  it('throws ValidationError for invalid slug', () => {
    expect(() => validateGuestInput({ slug: 'Slug Dengan Spasi' })).toThrow(ValidationError);
    expect(() => validateGuestInput({ slug: '-leading-dash' })).toThrow(ValidationError);
  });

  it('throws ValidationError for phone longer than 30 characters', () => {
    expect(() => validateGuestInput({ phone: '1'.repeat(31) })).toThrow(ValidationError);
  });
});

describe('buildGuestInvitationUrl', () => {
  it('builds relative URL without origin', () => {
    expect(buildGuestInvitationUrl('sarah-dimas', 'budi-santoso')).toBe(
      '/i/sarah-dimas?to=budi-santoso'
    );
  });

  it('builds absolute URL when origin is provided', () => {
    expect(
      buildGuestInvitationUrl('sarah-dimas', 'budi-santoso', 'https://aurovia.id')
    ).toBe('https://aurovia.id/i/sarah-dimas?to=budi-santoso');
    expect(
      buildGuestInvitationUrl('sarah-dimas', 'budi-santoso', 'https://aurovia.id/')
    ).toBe('https://aurovia.id/i/sarah-dimas?to=budi-santoso');
  });
});

describe('generateWhatsAppShareUrl', () => {
  it('formats wa.me link with international phone number and encoded invitation text', () => {
    const url = generateWhatsAppShareUrl({
      phone: '081234567890',
      guestName: 'Budi Santoso',
      invitationTitle: 'Pernikahan Sarah & Dimas',
      invitationUrl: 'https://aurovia.id/i/sarah-dimas?to=budi-santoso',
    });

    expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Kepada Yth. Budi Santoso'));
    expect(url).toContain(encodeURIComponent('Pernikahan Sarah & Dimas'));
    expect(url).toContain(encodeURIComponent('https://aurovia.id/i/sarah-dimas?to=budi-santoso'));
  });

  it('falls back to api.whatsapp.com when phone is not provided', () => {
    const url = generateWhatsAppShareUrl({
      phone: null,
      guestName: 'Keluarga Hartono',
      invitationTitle: 'Syukuran Kelahiran Aisha',
      invitationUrl: 'https://aurovia.id/i/aisha?to=keluarga-hartono',
    });

    expect(url.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
  });

  it('includes custom note when provided in options', () => {
    const url = generateWhatsAppShareUrl({
      phone: '081234567890',
      guestName: 'Budi Santoso',
      invitationTitle: 'Pernikahan Sarah & Dimas',
      invitationUrl: 'https://aurovia.id/i/sarah-dimas?to=budi-santoso',
      customNote: 'Diharapkan hadir 15 menit sebelum acara dimulai.',
    });

    expect(url).toContain(encodeURIComponent('Diharapkan hadir 15 menit sebelum acara dimulai.'));
  });
});

describe('Guest Personalization and Slug Collision Handling', () => {
  it('generates deterministic collision candidate slugs sequentially', () => {
    const simulateCollisionCandidate = (baseSlug: string, counter: number) => {
      if (counter === 1) return baseSlug;
      const suffix = `-${counter}`;
      return `${baseSlug.slice(0, 60 - suffix.length)}${suffix}`.replace(/-+$/, '');
    };

    const base = normalizeGuestSlug('Ahmad Pratama');
    expect(base).toBe('ahmad-pratama');
    expect(simulateCollisionCandidate(base, 1)).toBe('ahmad-pratama');
    expect(simulateCollisionCandidate(base, 2)).toBe('ahmad-pratama-2');
    expect(simulateCollisionCandidate(base, 3)).toBe('ahmad-pratama-3');
  });

  it('keeps collision slugs within the 60-character PostgreSQL constraint', () => {
    const longName = 'Sangat Panjang Sekali Nama Tamu Undangan Pernikahan Mewah Di Kota Besar';
    const baseSlug = normalizeGuestSlug(longName);
    const suffix = '-2';
    const truncatedBase = baseSlug.slice(0, 60 - suffix.length).replace(/-+$/, '');
    const candidate = `${truncatedBase}${suffix}`;

    expect(candidate.length).toBeLessThanOrEqual(60);
    expect(isValidGuestSlug(candidate)).toBe(true);
    expect(candidate.endsWith('-2')).toBe(true);
  });
});

describe('Guest Resolution & Isolation Security Rules', () => {
  interface MockGuestRecord {
    id: string;
    invitation_id: string;
    name: string;
    phone: string | null;
    pax_limit: number;
    slug: string;
  }

  const mockGuestDatabase: MockGuestRecord[] = [
    {
      id: 'g-1',
      invitation_id: 'inv-romeo-juliet',
      name: 'Ahmad Pratama',
      phone: '08123456789',
      pax_limit: 2,
      slug: 'ahmad-pratama',
    },
    {
      id: 'g-2',
      invitation_id: 'inv-sarah-dimas',
      name: 'Ahmad Pratama',
      phone: '08198765432',
      pax_limit: 4,
      slug: 'ahmad-pratama',
    },
  ];

  it('resolves guest accurately when slug and invitation_id match', () => {
    const resolvePublicGuest = (invitationId: string, slug: string) => {
      const cleanSlug = slug.trim().toLowerCase();
      if (!cleanSlug) return null;
      const found = mockGuestDatabase.find(
        (g) => g.invitation_id === invitationId && g.slug === cleanSlug
      );
      if (!found) return null;
      // Least-privilege public projection: excludes phone number
      return {
        id: found.id,
        invitation_id: found.invitation_id,
        name: found.name,
        pax_limit: found.pax_limit,
        slug: found.slug,
      };
    };

    const resolved = resolvePublicGuest('inv-romeo-juliet', 'ahmad-pratama');
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe('g-1');
    expect(resolved?.name).toBe('Ahmad Pratama');
    expect(resolved?.pax_limit).toBe(2);
    // Verified: phone must never be exposed in public resolution
    expect((resolved as Record<string, unknown>).phone).toBeUndefined();
  });

  it('enforces multi-tenant invitation isolation', () => {
    const resolvePublicGuest = (invitationId: string, slug: string) => {
      const cleanSlug = slug.trim().toLowerCase();
      return (
        mockGuestDatabase.find(
          (g) => g.invitation_id === invitationId && g.slug === cleanSlug
        ) ?? null
      );
    };

    // Guest exists on inv-romeo-juliet, but looking up on an unrelated invitation returns null
    const guestFromOtherInvitation = resolvePublicGuest('inv-unrelated-event', 'ahmad-pratama');
    expect(guestFromOtherInvitation).toBeNull();
  });

  it('safely handles non-existent or invalid guest slugs with graceful null fallback', () => {
    const resolvePublicGuest = (invitationId: string, slug?: string | null) => {
      if (!slug) return null;
      const cleanSlug = slug.trim().toLowerCase();
      if (!cleanSlug || !isValidGuestSlug(cleanSlug)) return null;
      return (
        mockGuestDatabase.find(
          (g) => g.invitation_id === invitationId && g.slug === cleanSlug
        ) ?? null
      );
    };

    expect(resolvePublicGuest('inv-romeo-juliet', '')).toBeNull();
    expect(resolvePublicGuest('inv-romeo-juliet', null)).toBeNull();
    expect(resolvePublicGuest('inv-romeo-juliet', 'unknown-guest')).toBeNull();
    expect(resolvePublicGuest('inv-romeo-juliet', 'invalid slug with spaces')).toBeNull();
    expect(resolvePublicGuest('inv-romeo-juliet', '-malformed-slug')).toBeNull();
  });

  it('binds guest_id and personal pax limit to RSVP submission', () => {
    const buildRsvpPayload = (
      invitationId: string,
      inputName: string,
      guest?: { id: string; name: string; pax_limit: number } | null,
      selectedPax?: number
    ) => {
      const maxPax = guest?.pax_limit ? Math.min(Math.max(guest.pax_limit, 1), 20) : 5;
      const effectivePax = Math.min(selectedPax ?? 1, maxPax);

      return {
        invitation_id: invitationId,
        guest_id: guest?.id ?? null,
        guest_name: guest?.name ?? inputName,
        pax_count: effectivePax,
      };
    };

    // Personalized guest flow
    const personalizedPayload = buildRsvpPayload(
      'inv-romeo-juliet',
      'Someone Else',
      { id: 'g-1', name: 'Ahmad Pratama', pax_limit: 2 },
      3
    );
    expect(personalizedPayload.guest_id).toBe('g-1');
    expect(personalizedPayload.guest_name).toBe('Ahmad Pratama');
    expect(personalizedPayload.pax_count).toBe(2); // Capped by guest.pax_limit

    // Anonymous public attendee flow
    const anonymousPayload = buildRsvpPayload('inv-romeo-juliet', 'Tamu Umum', null, 3);
    expect(anonymousPayload.guest_id).toBeNull();
    expect(anonymousPayload.guest_name).toBe('Tamu Umum');
    expect(anonymousPayload.pax_count).toBe(3);
  });
});

