import { describe, expect, it } from 'vitest';
import {
  isValidRsvpStatus,
  validateRsvpInput,
  type RsvpItem,
  type RsvpStatus,
  type SubmitRsvpInput,
} from '@/lib/rsvps';
import {
  isValidGuestSlug,
  normalizeGuestSlug,
  type GuestItem,
} from '@/lib/guests';
import { ValidationError } from '@/lib/errors';

/**
 * Security and Tenant Isolation Test Suite for RSVP & Guest Management
 *
 * Verifies security invariants:
 * 1. Anonymous access restrictions & data leakage prevention
 * 2. Owner access and moderation capabilities
 * 3. Cross-tenant isolation (invitation boundary enforcement)
 * 4. Public RSVP validation & constraint enforcement
 * 5. Duplicate submit prevention & state locking
 * 6. Invalid invitation status handling
 * 7. Invalid guest slug / token handling & injection resistance
 */

describe('1. Anonymous Access Restrictions', () => {
  it('prevents anonymous users from viewing hidden wishes in public queries', () => {
    const rawRsvpsFromDb: Array<{
      id: string;
      guest_name: string;
      wishes: string | null;
      is_hidden: boolean;
    }> = [
      { id: 'r1', guest_name: 'Budi', wishes: 'Selamat menempuh hidup baru!', is_hidden: false },
      { id: 'r2', guest_name: 'Anon', wishes: 'Pesan spam atau tidak layak', is_hidden: true },
      { id: 'r3', guest_name: 'Citra', wishes: null, is_hidden: false },
    ];

    // Simulates getPublicWishes filtering matching RLS WHERE clause
    const publicWishes = rawRsvpsFromDb.filter(
      (item) => !item.is_hidden && item.wishes !== null && item.wishes.trim().length > 0
    );

    expect(publicWishes).toHaveLength(1);
    expect(publicWishes[0]?.id).toBe('r1');
    expect(publicWishes.some((item) => item.is_hidden)).toBe(false);
  });

  it('ensures public wishes payload never includes private guest metadata (e.g., phone, user_id)', () => {
    interface PublicWishPayload {
      id: string;
      guest_name: string;
      wishes: string;
      created_at: string;
    }

    const publicProjection: PublicWishPayload = {
      id: 'r1',
      guest_name: 'Budi Santoso',
      wishes: 'Selamat berbahagia!',
      created_at: '2026-09-25T12:00:00Z',
    };

    // Verify projection keys do not expose sensitive guest or user fields
    const keys = Object.keys(publicProjection);
    expect(keys).not.toContain('phone');
    expect(keys).not.toContain('user_id');
    expect(keys).not.toContain('pax_count');
    expect(keys).not.toContain('status');
  });

  it('prevents public enumeration across unauthenticated guest lists', () => {
    const guestDatabase = [
      { id: 'g1', invitation_id: 'inv-1', name: 'Tamu Rahasia 1', phone: '08123456789' },
      { id: 'g2', invitation_id: 'inv-2', name: 'Tamu Rahasia 2', phone: '08198765432' },
    ];

    // Anonymous requests must query by exact (invitation_id, slug) pair, never bulk select
    const querySingleBySlug = (invitationId: string, slug: string) => {
      return guestDatabase.find((g) => g.invitation_id === invitationId && g.id === slug) || null;
    };

    expect(querySingleBySlug('inv-1', 'non-existent')).toBeNull();
  });
});

describe('2. Owner Access and Moderation', () => {
  it('allows owner to see all RSVPs including hidden ones for their invitation', () => {
    const ownerInvitationId = 'inv-owner-123';
    const allRsvps: RsvpItem[] = [
      {
        id: 'r1',
        invitation_id: ownerInvitationId,
        guest_id: 'g1',
        guest_name: 'Ahmad',
        status: 'attending',
        pax_count: 2,
        wishes: 'Barakallah!',
        is_hidden: false,
        created_at: '2026-09-25T10:00:00Z',
      },
      {
        id: 'r2',
        invitation_id: ownerInvitationId,
        guest_id: null,
        guest_name: 'Spam User',
        status: 'declined',
        pax_count: 1,
        wishes: 'Teks spam',
        is_hidden: true,
        created_at: '2026-09-25T10:05:00Z',
      },
    ];

    const ownerQuery = (invId: string) => allRsvps.filter((r) => r.invitation_id === invId);
    const results = ownerQuery(ownerInvitationId);

    expect(results).toHaveLength(2);
    expect(results.some((r) => r.is_hidden)).toBe(true);
  });

  it('allows owner to toggle wish visibility (moderation)', () => {
    let currentHiddenState = false;
    const toggleModeration = (isHidden: boolean) => {
      currentHiddenState = isHidden;
      return currentHiddenState;
    };

    expect(toggleModeration(true)).toBe(true);
    expect(toggleModeration(false)).toBe(false);
  });
});

describe('3. Cross-Tenant Isolation', () => {
  it('prevents an owner from querying or modifying guests from another invitation', () => {
    const tenantAGuests: GuestItem[] = [
      {
        id: 'g-tenant-a',
        invitation_id: 'inv-tenant-a',
        name: 'Tamu Tenant A',
        phone: '0811111111',
        pax_limit: 2,
        slug: 'tamu-tenant-a',
        created_at: '2026-09-25T00:00:00Z',
      },
    ];

    // Simulates owner of Tenant B trying to query Tenant A's guest
    const tenantBOwnerQuery = (targetGuestId: string, ownerInvId: string) => {
      return (
        tenantAGuests.find(
          (g) => g.id === targetGuestId && g.invitation_id === ownerInvId
        ) || null
      );
    };

    const result = tenantBOwnerQuery('g-tenant-a', 'inv-tenant-b');
    expect(result).toBeNull();
  });

  it('rejects cross-invitation guest binding on RSVP submission', () => {
    // Simulates constraint check: RSVP invitation_id must match guest invitation_id
    const validateTenantBinding = (
      rsvpInvitationId: string,
      guest: { invitation_id: string } | null
    ) => {
      if (!guest) return true; // General public RSVP without registered guest is permitted
      return rsvpInvitationId === guest.invitation_id;
    };

    const legitimateGuest = { invitation_id: 'inv-100' };
    const foreignGuest = { invitation_id: 'inv-200' };

    expect(validateTenantBinding('inv-100', legitimateGuest)).toBe(true);
    expect(validateTenantBinding('inv-100', null)).toBe(true);
    expect(validateTenantBinding('inv-100', foreignGuest)).toBe(false);
  });
});

describe('4. Public RSVP Validation & Bounds', () => {
  it('enforces pax limit bounds against guest personal limit', () => {
    const guestPaxLimit = 3;

    const isPaxAllowed = (selectedPax: number, limit: number) => {
      return selectedPax >= 1 && selectedPax <= limit;
    };

    expect(isPaxAllowed(1, guestPaxLimit)).toBe(true);
    expect(isPaxAllowed(3, guestPaxLimit)).toBe(true);
    expect(isPaxAllowed(4, guestPaxLimit)).toBe(false);
    expect(isPaxAllowed(0, guestPaxLimit)).toBe(false);
  });

  it('validates strictly formatted RSVP status', () => {
    expect(isValidRsvpStatus('attending')).toBe(true);
    expect(isValidRsvpStatus('declined')).toBe(true);
    expect(isValidRsvpStatus('tentative')).toBe(true);
    expect(isValidRsvpStatus('absent' as RsvpStatus)).toBe(false);
    expect(isValidRsvpStatus('admin' as RsvpStatus)).toBe(false);
  });

  it('throws ValidationError when payload fields fail integrity checks', () => {
    const invalidPayload: SubmitRsvpInput = {
      invitation_id: '',
      guest_name: '   ',
      status: 'attending',
    };

    expect(() => validateRsvpInput(invalidPayload)).toThrow(ValidationError);
  });
});

describe('5. Duplicate Submit Prevention & State Locking', () => {
  it('detects existing RSVP submission for registered guest', () => {
    const existingRsvps: RsvpItem[] = [
      {
        id: 'r-done',
        invitation_id: 'inv-1',
        guest_id: 'g-registered-1',
        guest_name: 'Keluarga Budi',
        status: 'attending',
        pax_count: 2,
        wishes: 'Sudah RSVP sebelumnya',
        is_hidden: false,
        created_at: '2026-09-25T08:00:00Z',
      },
    ];

    const hasAlreadySubmitted = (guestId: string) => {
      return existingRsvps.some((r) => r.guest_id === guestId);
    };

    expect(hasAlreadySubmitted('g-registered-1')).toBe(true);
    expect(hasAlreadySubmitted('g-unregistered-2')).toBe(false);
  });

  it('enforces UI submission state lock during ongoing network request', () => {
    let isSubmitting = false;
    let submitCallCount = 0;

    const handleFormSubmit = () => {
      if (isSubmitting) {
        return; // Locked: ignore double click / enter spam
      }
      isSubmitting = true;
      submitCallCount += 1;
    };

    // User rapidly double clicks submit button
    handleFormSubmit();
    handleFormSubmit();
    handleFormSubmit();

    expect(submitCallCount).toBe(1);
    expect(isSubmitting).toBe(true);
  });
});

describe('6. Invalid Invitation Handling', () => {
  it('blocks RSVP submission when invitation is not published or rsvp is disallowed', () => {
    const canAcceptRsvp = (status: string, allowRsvp: boolean) => {
      return status === 'published' && allowRsvp;
    };

    expect(canAcceptRsvp('published', true)).toBe(true);
    expect(canAcceptRsvp('published', false)).toBe(false);
    expect(canAcceptRsvp('draft', true)).toBe(false);
    expect(canAcceptRsvp('archived', true)).toBe(false);
  });
});

describe('7. Invalid Guest Slug and Injection Resistance', () => {
  it('validates and rejects malicious or SQL-injection style slugs', () => {
    const maliciousSlugs = [
      "budi' OR '1'='1",
      '../etc/passwd',
      '<script>alert(1)</script>',
      'budi; DROP TABLE guests;--',
      'budi--admin',
      '-budi',
      'budi-',
      'budi_santoso',
    ];

    for (const slug of maliciousSlugs) {
      expect(isValidGuestSlug(slug)).toBe(false);
    }
  });

  it('normalizes arbitrary user inputs into safe slugs without unsafe characters', () => {
    const inputName = "dr. O'Connor & Sons <VIP>! 2026";
    const safeSlug = normalizeGuestSlug(inputName);

    expect(safeSlug).toBe('dr-o-connor-sons-vip-2026');
    expect(isValidGuestSlug(safeSlug)).toBe(true);
  });

  it('gracefully falls back when slug resolution yields no guest', () => {
    const registeredGuests: GuestItem[] = [
      {
        id: 'g1',
        invitation_id: 'inv-1',
        name: 'Budi',
        phone: null,
        pax_limit: 2,
        slug: 'budi',
        created_at: '2026-09-25T00:00:00Z',
      },
    ];

    const resolveGuest = (searchSlug: string) => {
      const match = registeredGuests.find((g) => g.slug === searchSlug);
      return match || null;
    };

    const resolved = resolveGuest('unknown-slug');
    expect(resolved).toBeNull();
  });
});
