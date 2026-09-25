import { supabase } from '@/lib/supabase';
import { DatabaseError, ValidationError } from '@/lib/errors';
import type { Tables, TablesInsert } from '@/types/database';

export type RsvpItem = Tables<'rsvps'>;
export type RsvpInsert = TablesInsert<'rsvps'>;
export type RsvpStatus = 'attending' | 'declined' | 'tentative';

export interface SubmitRsvpInput {
  invitation_id: string;
  guest_name: string;
  status: RsvpStatus;
  pax_count?: number;
  wishes?: string | null;
  guest_id?: string | null;
}

export type PublicRsvpWish = Pick<
  RsvpItem,
  'id' | 'invitation_id' | 'guest_name' | 'wishes' | 'created_at'
>;

export interface RsvpFilters {
  status?: RsvpStatus | 'all';
  search?: string;
}

export interface RsvpSummary {
  totalResponses: number;
  attendingCount: number;
  attendingPax: number;
  declinedCount: number;
  tentativeCount: number;
  tentativePax: number;
}

const ALLOWED_STATUSES: readonly RsvpStatus[] = ['attending', 'declined', 'tentative'] as const;

export function isValidRsvpStatus(status: unknown): status is RsvpStatus {
  return typeof status === 'string' && ALLOWED_STATUSES.includes(status as RsvpStatus);
}

export function validateRsvpInput(input: SubmitRsvpInput): void {
  if (!input.invitation_id || typeof input.invitation_id !== 'string') {
    throw new ValidationError('ID undangan wajib diisi.');
  }

  const trimmedName = input.guest_name?.trim();
  if (!trimmedName) {
    throw new ValidationError('Nama tamu konfirmasi RSVP wajib diisi.');
  }

  if (trimmedName.length > 100) {
    throw new ValidationError('Nama tamu tidak boleh melebihi 100 karakter.');
  }

  if (!isValidRsvpStatus(input.status)) {
    throw new ValidationError('Status kehadiran harus bernilai attending, declined, atau tentative.');
  }

  const pax = input.pax_count ?? 1;
  if (!Number.isInteger(pax) || pax < 1 || pax > 20) {
    throw new ValidationError('Jumlah tamu hadir (pax) harus berupa angka antara 1 hingga 20.');
  }

  if (input.wishes) {
    const trimmedWishes = input.wishes.trim();
    if (trimmedWishes.length > 500) {
      throw new ValidationError('Ucapan atau doa restu maksimal 500 karakter.');
    }
  }
}

export async function submitRsvp(input: SubmitRsvpInput): Promise<RsvpItem> {
  validateRsvpInput(input);

  const trimmedName = input.guest_name.trim();
  const trimmedWishes = input.wishes?.trim() || null;
  const paxCount = input.status === 'declined' ? 1 : (input.pax_count ?? 1);

  // Column-level security and RLS enforce is_hidden = false for public insertions.
  const payload: RsvpInsert = {
    invitation_id: input.invitation_id,
    guest_name: trimmedName,
    status: input.status,
    pax_count: paxCount,
    wishes: trimmedWishes,
    is_hidden: false,
    guest_id: input.guest_id || null,
  };

  const { data, error } = await supabase
    .from('rsvps')
    .insert(payload)
    .select('id, invitation_id, guest_id, guest_name, status, pax_count, wishes, is_hidden, created_at')
    .single();

  if (error) {
    throw new DatabaseError('Gagal mengirimkan konfirmasi kehadiran RSVP.', error);
  }

  return data;
}

export async function getPublicWishes(
  invitationId: string,
  limit = 50,
  offset = 0
): Promise<PublicRsvpWish[]> {
  // Respects anonymous column grants: id, invitation_id, guest_name, wishes, created_at.
  const { data, error } = await supabase
    .from('rsvps')
    .select('id, invitation_id, guest_name, wishes, created_at')
    .eq('invitation_id', invitationId)
    .eq('is_hidden', false)
    .not('wishes', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new DatabaseError('Gagal memuat ucapan dan doa restu tamu.', error);
  }

  return (data as PublicRsvpWish[]) ?? [];
}

export async function getInvitationRsvps(
  invitationId: string,
  filters?: RsvpFilters
): Promise<RsvpItem[]> {
  let query = supabase
    .from('rsvps')
    .select('id, invitation_id, guest_id, guest_name, status, pax_count, wishes, is_hidden, created_at')
    .eq('invitation_id', invitationId)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    const term = filters.search.trim();
    if (term) {
      query = query.ilike('guest_name', `%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new DatabaseError('Gagal memuat rekap RSVP undangan.', error);
  }

  return data ?? [];
}

export async function toggleRsvpHidden(
  rsvpId: string,
  invitationId: string,
  isHidden: boolean
): Promise<RsvpItem> {
  const { data, error } = await supabase
    .from('rsvps')
    .update({ is_hidden: isHidden })
    .eq('id', rsvpId)
    .eq('invitation_id', invitationId)
    .select('id, invitation_id, guest_id, guest_name, status, pax_count, wishes, is_hidden, created_at')
    .single();

  if (error) {
    throw new DatabaseError('Gagal memperbarui status moderasi ucapan.', error);
  }

  return data;
}

export async function deleteRsvp(
  rsvpId: string,
  invitationId: string
): Promise<void> {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('id', rsvpId)
    .eq('invitation_id', invitationId);

  if (error) {
    throw new DatabaseError('Gagal menghapus data RSVP.', error);
  }
}

export function calculateRsvpSummary(rsvps: readonly RsvpItem[]): RsvpSummary {
  let attendingCount = 0;
  let attendingPax = 0;
  let declinedCount = 0;
  let tentativeCount = 0;
  let tentativePax = 0;

  for (const item of rsvps) {
    if (item.status === 'attending') {
      attendingCount += 1;
      attendingPax += item.pax_count;
    } else if (item.status === 'declined') {
      declinedCount += 1;
    } else if (item.status === 'tentative') {
      tentativeCount += 1;
      tentativePax += item.pax_count;
    }
  }

  return {
    totalResponses: rsvps.length,
    attendingCount,
    attendingPax,
    declinedCount,
    tentativeCount,
    tentativePax,
  };
}
