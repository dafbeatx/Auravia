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
  'id' | 'slug' | 'name' | 'category' | 'description' | 'thumbnail_url' | 'default_theme' | 'default_sections' | 'is_active'
>;

import { getAllTemplateDefinitions } from '@/lib/template/definitions';

function getFallbackTemplateList(): TemplateListItem[] {
  return getAllTemplateDefinitions().map((def) => ({
    id: def.id,
    slug: def.slug,
    name: def.name,
    category: def.category,
    description: def.description,
    thumbnail_url: def.identity?.thumbnailUrl || `/templates/${def.slug}/thumbnail.webp`,
    default_theme: def.defaultTheme as unknown as import('@/types/database').Json,
    default_sections: def.sections as unknown as import('@/types/database').Json,
    is_active: true,
  }));
}

/**
 * Mengambil data template aktif untuk katalog pilihan pengguna.
 * Memilih kolom secara eksplisit dan hanya mengambil template berstatus is_active = true.
 */
export async function getActiveTemplates(): Promise<TemplateListItem[]> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getFallbackTemplateList();
    }

    const dbSlugs = new Set(data.map((t) => t.slug));
    const fallbackList = getFallbackTemplateList();
    const missing = fallbackList.filter((fb) => !dbSlugs.has(fb.slug));

    return [...data, ...missing];
  } catch {
    return getFallbackTemplateList();
  }
}

/**
 * Mengambil seluruh data template (aktif maupun tidak) untuk tampilan pemilih template.
 * Template tidak aktif tetap dapat ditampilkan namun dinonaktifkan dari pemilihan.
 */
export async function getAllTemplates(): Promise<TemplateListItem[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat seluruh template.', error);
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

  try {
    let query = supabase
      .from('templates')
      .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active')
      .eq('slug', cleanSlug);

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const fallback = getFallbackTemplateList().find((t) => t.slug === cleanSlug);
      return fallback ?? null;
    }

    return data;
  } catch {
    const fallback = getFallbackTemplateList().find((t) => t.slug === cleanSlug);
    return fallback ?? null;
  }
}
