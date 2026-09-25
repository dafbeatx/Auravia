import { describe, expect, it } from 'vitest';
import {
  calculateRsvpSummary,
  isValidRsvpStatus,
  validateRsvpInput,
  type RsvpItem,
  type RsvpStatus,
} from '@/lib/rsvps';
import { ValidationError } from '@/lib/errors';

describe('isValidRsvpStatus', () => {
  it('returns true for database-accepted status values', () => {
    expect(isValidRsvpStatus('attending')).toBe(true);
    expect(isValidRsvpStatus('declined')).toBe(true);
    expect(isValidRsvpStatus('tentative')).toBe(true);
  });

  it('returns false for unrecognized or malformed statuses', () => {
    expect(isValidRsvpStatus('present')).toBe(false);
    expect(isValidRsvpStatus('maybe')).toBe(false);
    expect(isValidRsvpStatus('')).toBe(false);
    expect(isValidRsvpStatus(null)).toBe(false);
    expect(isValidRsvpStatus(123)).toBe(false);
  });
});

describe('validateRsvpInput', () => {
  it('passes on valid RSVP submission payload', () => {
    expect(() => {
      validateRsvpInput({
        invitation_id: '123e4567-e89b-12d3-a456-426614174000',
        guest_name: 'Budi Santoso',
        status: 'attending',
        pax_count: 2,
        wishes: 'Selamat atas pernikahannya! Semoga senantiasa berbahagia.',
      });
    }).not.toThrow();
  });

  it('throws ValidationError when invitation_id is missing', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: '',
        guest_name: 'Budi Santoso',
        status: 'attending',
      })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for empty or blank guest_name', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: '   ',
        status: 'attending',
      })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for guest_name exceeding 100 characters', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: 'A'.repeat(101),
        status: 'attending',
      })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for invalid status', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: 'Budi Santoso',
        status: 'hadir' as unknown as RsvpStatus,
      })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when pax_count is invalid', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: 'Budi Santoso',
        status: 'attending',
        pax_count: 0,
      })
    ).toThrow(ValidationError);

    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: 'Budi Santoso',
        status: 'attending',
        pax_count: 21,
      })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when wishes exceed 500 characters', () => {
    expect(() =>
      validateRsvpInput({
        invitation_id: 'valid-id',
        guest_name: 'Budi Santoso',
        status: 'attending',
        wishes: 'X'.repeat(501),
      })
    ).toThrow(ValidationError);
  });
});

describe('calculateRsvpSummary', () => {
  it('returns all zeros for empty RSVP list', () => {
    const summary = calculateRsvpSummary([]);
    expect(summary).toEqual({
      totalResponses: 0,
      attendingCount: 0,
      attendingPax: 0,
      declinedCount: 0,
      tentativeCount: 0,
      tentativePax: 0,
    });
  });

  it('accurately aggregates actual responses without fabricated counts', () => {
    const mockRsvps: RsvpItem[] = [
      {
        id: '1',
        invitation_id: 'inv-1',
        guest_id: null,
        guest_name: 'Ahmad',
        status: 'attending',
        pax_count: 2,
        wishes: 'Selamat!',
        is_hidden: false,
        created_at: '2026-09-25T10:00:00Z',
      },
      {
        id: '2',
        invitation_id: 'inv-1',
        guest_id: null,
        guest_name: 'Budi',
        status: 'attending',
        pax_count: 3,
        wishes: null,
        is_hidden: false,
        created_at: '2026-09-25T10:05:00Z',
      },
      {
        id: '3',
        invitation_id: 'inv-1',
        guest_id: null,
        guest_name: 'Citra',
        status: 'declined',
        pax_count: 1,
        wishes: 'Maaf belum bisa hadir.',
        is_hidden: false,
        created_at: '2026-09-25T10:10:00Z',
      },
      {
        id: '4',
        invitation_id: 'inv-1',
        guest_id: null,
        guest_name: 'Doni',
        status: 'tentative',
        pax_count: 2,
        wishes: 'Diupayakan hadir.',
        is_hidden: false,
        created_at: '2026-09-25T10:15:00Z',
      },
    ];

    const summary = calculateRsvpSummary(mockRsvps);

    expect(summary.totalResponses).toBe(4);
    expect(summary.attendingCount).toBe(2);
    expect(summary.attendingPax).toBe(5);
    expect(summary.declinedCount).toBe(1);
    expect(summary.tentativeCount).toBe(1);
    expect(summary.tentativePax).toBe(2);
  });
});
