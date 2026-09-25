import { supabase } from '@/lib/supabase';
import { DatabaseError, ValidationError } from '@/lib/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type GuestItem = Tables<'guests'>;
export type GuestInsert = TablesInsert<'guests'>;
export type GuestUpdate = TablesUpdate<'guests'>;

export interface CreateGuestInput {
  name: string;
  phone?: string | null;
  pax_limit?: number;
  slug?: string;
}

export interface UpdateGuestInput {
  name?: string;
  phone?: string | null;
  pax_limit?: number;
  slug?: string;
}

export interface GuestFilter {
  search?: string;
}

// Slug format requirement defined by PostgreSQL check constraint: ^[a-z0-9]+(-[a-z0-9]+)*$ with max length 60.
const GUEST_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function normalizeGuestSlug(input: string): string {
  const sanitized = input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!sanitized) {
    return 'tamu';
  }

  return sanitized.slice(0, 60).replace(/-+$/, '');
}

export function isValidGuestSlug(slug: string): boolean {
  if (!slug || slug.length > 60) return false;
  return GUEST_SLUG_REGEX.test(slug);
}

export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  // Clean common formatting characters
  const digitsOnly = trimmed.replace(/[\s\-().]/g, '');

  // Convert local Indonesian prefix 08xx to standard international format 628xx
  if (digitsOnly.startsWith('08')) {
    return '62' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('+62')) {
    return digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('+')) {
    return digitsOnly.slice(1);
  }

  return digitsOnly;
}

export function validateGuestInput(input: {
  name?: string;
  phone?: string | null;
  pax_limit?: number;
  slug?: string;
}): void {
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new ValidationError('Nama tamu wajib diisi.');
    }
    if (trimmedName.length > 100) {
      throw new ValidationError('Nama tamu tidak boleh melebihi 100 karakter.');
    }
  }

  if (input.pax_limit !== undefined) {
    if (
      !Number.isInteger(input.pax_limit) ||
      input.pax_limit < 1 ||
      input.pax_limit > 20
    ) {
      throw new ValidationError('Batas jumlah tamu (pax) harus bernilai antara 1 hingga 20.');
    }
  }

  if (input.slug !== undefined) {
    if (!isValidGuestSlug(input.slug)) {
      throw new ValidationError(
        'Format slug tamu tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (maksimal 60 karakter).'
      );
    }
  }

  if (input.phone) {
    const cleaned = input.phone.trim();
    if (cleaned.length > 30) {
      throw new ValidationError('Nomor telepon/WhatsApp maksimal 30 karakter.');
    }
  }
}

export async function resolveUniqueGuestSlug(
  invitationId: string,
  preferredSlug: string,
  excludeGuestId?: string
): Promise<string> {
  const baseSlug = normalizeGuestSlug(preferredSlug);
  let candidate = baseSlug;
  let counter = 1;

  while (counter <= 50) {
    let query = supabase
      .from('guests')
      .select('id')
      .eq('invitation_id', invitationId)
      .eq('slug', candidate);

    if (excludeGuestId) {
      query = query.neq('id', excludeGuestId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new DatabaseError('Gagal memverifikasi keunikan slug tamu.', error);
    }

    if (!data) {
      return candidate;
    }

    counter += 1;
    const suffix = `-${counter}`;
    const truncatedBase = baseSlug.slice(0, 60 - suffix.length).replace(/-+$/, '');
    candidate = `${truncatedBase}${suffix}`;
  }

  // Fallback random suffix when counter exhausts
  const randomSuffix = `-${Math.random().toString(36).substring(2, 6)}`;
  const truncatedFallbackBase = baseSlug.slice(0, 60 - randomSuffix.length).replace(/-+$/, '');
  return `${truncatedFallbackBase}${randomSuffix}`;
}

export async function getInvitationGuests(
  invitationId: string,
  filter?: GuestFilter
): Promise<GuestItem[]> {
  let query = supabase
    .from('guests')
    .select('id, invitation_id, name, phone, pax_limit, slug, created_at')
    .eq('invitation_id', invitationId)
    .order('created_at', { ascending: false });

  if (filter?.search) {
    const term = filter.search.trim();
    if (term) {
      query = query.ilike('name', `%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new DatabaseError('Gagal memuat daftar tamu undangan.', error);
  }

  return data ?? [];
}

export async function getGuestById(
  guestId: string,
  invitationId: string
): Promise<GuestItem | null> {
  const { data, error } = await supabase
    .from('guests')
    .select('id, invitation_id, name, phone, pax_limit, slug, created_at')
    .eq('id', guestId)
    .eq('invitation_id', invitationId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal mengambil data tamu.', error);
  }

  return data;
}

export async function getGuestBySlug(
  invitationId: string,
  slug: string
): Promise<GuestItem | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const { data, error } = await supabase
    .from('guests')
    .select('id, invitation_id, name, pax_limit, slug')
    .eq('invitation_id', invitationId)
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (error) {
    // Graceful fallback: do not crash public page on slug query errors
    return null;
  }

  return data as GuestItem | null;
}

export async function createGuest(
  invitationId: string,
  input: CreateGuestInput
): Promise<GuestItem> {
  validateGuestInput({
    name: input.name,
    pax_limit: input.pax_limit ?? 1,
    phone: input.phone,
    slug: input.slug,
  });

  const trimmedName = input.name.trim();
  const rawSlug = input.slug?.trim() || input.name;
  const uniqueSlug = await resolveUniqueGuestSlug(invitationId, rawSlug);
  const normalizedPhone = normalizePhoneNumber(input.phone);

  const payload: GuestInsert = {
    invitation_id: invitationId,
    name: trimmedName,
    phone: normalizedPhone,
    pax_limit: input.pax_limit ?? 1,
    slug: uniqueSlug,
  };

  const { data, error } = await supabase
    .from('guests')
    .insert(payload)
    .select('id, invitation_id, name, phone, pax_limit, slug, created_at')
    .single();

  if (error) {
    throw new DatabaseError('Gagal menambahkan tamu baru.', error);
  }

  return data;
}

export async function updateGuest(
  guestId: string,
  invitationId: string,
  input: UpdateGuestInput
): Promise<GuestItem> {
  validateGuestInput(input);

  const updatePayload: GuestUpdate = {};

  if (input.name !== undefined) {
    updatePayload.name = input.name.trim();
  }

  if (input.phone !== undefined) {
    updatePayload.phone = normalizePhoneNumber(input.phone);
  }

  if (input.pax_limit !== undefined) {
    updatePayload.pax_limit = input.pax_limit;
  }

  if (input.slug !== undefined) {
    const rawSlug = input.slug.trim();
    updatePayload.slug = await resolveUniqueGuestSlug(invitationId, rawSlug, guestId);
  }

  const { data, error } = await supabase
    .from('guests')
    .update(updatePayload)
    .eq('id', guestId)
    .eq('invitation_id', invitationId)
    .select('id, invitation_id, name, phone, pax_limit, slug, created_at')
    .single();

  if (error) {
    throw new DatabaseError('Gagal memperbarui data tamu.', error);
  }

  return data;
}

export async function deleteGuest(
  guestId: string,
  invitationId: string
): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId)
    .eq('invitation_id', invitationId);

  if (error) {
    throw new DatabaseError('Gagal menghapus data tamu.', error);
  }
}

export function buildGuestInvitationUrl(
  invitationSlug: string,
  guestSlug: string,
  origin?: string
): string {
  const resolvedOrigin =
    origin ?? (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  const path = `/i/${encodeURIComponent(invitationSlug)}?to=${encodeURIComponent(guestSlug)}`;
  if (!resolvedOrigin) {
    return path;
  }
  const cleanOrigin = resolvedOrigin.replace(/\/+$/, '');
  return `${cleanOrigin}${path}`;
}

export interface WhatsAppShareOptions {
  phone?: string | null;
  guestName: string;
  invitationTitle: string;
  invitationUrl: string;
  customNote?: string;
}

export function generateWhatsAppShareUrl(options: WhatsAppShareOptions): string {
  const { phone, guestName, invitationTitle, invitationUrl, customNote } = options;
  const normalizedPhone = normalizePhoneNumber(phone);

  const greeting = `Kepada Yth. ${guestName}`;
  const inviteBody = `Tanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri ${invitationTitle}.`;
  const linkText = `Silakan buka tautan undangan online Anda di bawah ini:\n${invitationUrl}`;
  const closing = customNote ? `\n\nCatatan:\n${customNote}` : '';
  const signOff = `\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Terima kasih.`;

  const message = `${greeting}\n\n${inviteBody}\n\n${linkText}${closing}${signOff}`;
  const encodedMessage = encodeURIComponent(message);

  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}
