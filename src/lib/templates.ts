import { supabase } from '@/lib/supabase';
import { DatabaseError } from '@/lib/errors';
import type { Tables } from '@/types/database';

export type TemplateDetail = Pick<
  Tables<'templates'>,
  | 'id'
  | 'slug'
  | 'name'
  | 'category'
  | 'description'
  | 'thumbnail_url'
  | 'default_theme'
  | 'default_sections'
  | 'is_active'
>;

export type TemplateListItem = Pick<
  Tables<'templates'>,
  'id' | 'slug' | 'name' | 'category' | 'description' | 'thumbnail_url' | 'is_active'
>;

/**
 * Mengambil data template aktif untuk katalog pilihan pengguna.
 * Memilih kolom secara eksplisit dan hanya mengambil template berstatus is_active = true.
 */
export async function getActiveTemplates(): Promise<TemplateListItem[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, name, category, description, thumbnail_url, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat katalog template.', error);
  }

  return data ?? [];
}

/**
 * Mengambil data detail template berdasarkan template_id.
 * Secara bawaan memfilter hanya template aktif (onlyActive = true).
 */
export async function getTemplateById(
  templateId: string,
  onlyActive = true
): Promise<TemplateDetail | null> {
  const cleanId = templateId.trim();
  if (!cleanId) return null;

  let query = supabase
    .from('templates')
    .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active')
    .eq('id', cleanId);

  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat informasi template.', error);
  }

  return data;
}

/**
 * Mengambil data detail template berdasarkan slug unik (misal: 'classic-elegance').
 * Secara bawaan memfilter hanya template aktif (onlyActive = true).
 */
export async function getTemplateBySlug(
  slug: string,
  onlyActive = true
): Promise<TemplateDetail | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  let query = supabase
    .from('templates')
    .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active')
    .eq('slug', cleanSlug);

  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat informasi template berdasarkan slug.', error);
  }

  return data;
}
