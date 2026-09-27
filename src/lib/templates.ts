import { supabase } from '@/lib/supabase';
import { DatabaseError } from '@/lib/errors';
import type { Tables } from '@/types/database';

import { getTemplateAssetPublicUrl } from '@/lib/admin';

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
  | 'status'
  | 'preview_mobile_path'
  | 'preview_desktop_path'
  | 'preview_thumbnail_path'
  | 'is_featured'
  | 'display_order'
>;

export type TemplateListItem = Pick<
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
  | 'status'
  | 'preview_mobile_path'
  | 'preview_desktop_path'
  | 'preview_thumbnail_path'
  | 'is_featured'
  | 'display_order'
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
    status: 'active',
    preview_mobile_path: null,
    preview_desktop_path: null,
    preview_thumbnail_path: null,
    is_featured: false,
    display_order: 0,
  }));
}

/**
 * Mengambil data template aktif untuk katalog pilihan pengguna.
 * Hanya mengambil template berstatus is_active = true dan status = 'active'.
 */
export async function getActiveTemplates(): Promise<TemplateListItem[]> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active, status, preview_mobile_path, preview_desktop_path, preview_thumbnail_path, is_featured, display_order')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getFallbackTemplateList();
    }

    const processedData = data.map((t) => ({
      ...t,
      thumbnail_url: t.preview_thumbnail_path
        ? getTemplateAssetPublicUrl(t.preview_thumbnail_path)
        : t.preview_mobile_path
        ? getTemplateAssetPublicUrl(t.preview_mobile_path)
        : t.thumbnail_url,
    }));

    const dbSlugs = new Set(processedData.map((t) => t.slug));
    const fallbackList = getFallbackTemplateList();
    const missing = fallbackList.filter((fb) => !dbSlugs.has(fb.slug));

    return [...processedData, ...missing];
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
    .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active, status, preview_mobile_path, preview_desktop_path, preview_thumbnail_path, is_featured, display_order')
    .order('is_active', { ascending: false })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new DatabaseError('Gagal memuat seluruh template.', error);
  }

  const processed = (data ?? []).map((t) => ({
    ...t,
    thumbnail_url: t.preview_thumbnail_path
      ? getTemplateAssetPublicUrl(t.preview_thumbnail_path)
      : t.preview_mobile_path
      ? getTemplateAssetPublicUrl(t.preview_mobile_path)
      : t.thumbnail_url,
  }));

  return processed;
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
    .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active, status, preview_mobile_path, preview_desktop_path, preview_thumbnail_path, is_featured, display_order')
    .eq('id', cleanId);

  if (onlyActive) {
    query = query.eq('is_active', true).eq('status', 'active');
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new DatabaseError('Gagal memuat informasi template.', error);
  }

  if (!data) return null;

  return {
    ...data,
    thumbnail_url: data.preview_thumbnail_path
      ? getTemplateAssetPublicUrl(data.preview_thumbnail_path)
      : data.preview_mobile_path
      ? getTemplateAssetPublicUrl(data.preview_mobile_path)
      : data.thumbnail_url,
  };
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
      .select('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active, status, preview_mobile_path, preview_desktop_path, preview_thumbnail_path, is_featured, display_order')
      .eq('slug', cleanSlug);

    if (onlyActive) {
      query = query.eq('is_active', true).eq('status', 'active');
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const fallback = getFallbackTemplateList().find((t) => t.slug === cleanSlug);
      return fallback ?? null;
    }

    return {
      ...data,
      thumbnail_url: data.preview_thumbnail_path
        ? getTemplateAssetPublicUrl(data.preview_thumbnail_path)
        : data.preview_mobile_path
        ? getTemplateAssetPublicUrl(data.preview_mobile_path)
        : data.thumbnail_url,
    };
  } catch {
    const fallback = getFallbackTemplateList().find((t) => t.slug === cleanSlug);
    return fallback ?? null;
  }
}
