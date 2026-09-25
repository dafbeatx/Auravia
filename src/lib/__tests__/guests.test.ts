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
});
