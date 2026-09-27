import type { TemplateDefinition } from '../types';
import { classicEleganceTemplate } from './classicElegance';
import { royalNavyGoldTemplate } from './royalNavyGold';
import { botanicalGardenTemplate } from './botanicalGarden';
import { modernMinimalTemplate } from './modernMinimal';

export {
  classicEleganceTemplate,
  royalNavyGoldTemplate,
  botanicalGardenTemplate,
  modernMinimalTemplate,
};

/**
 * Peta seluruh definisi template terdaftar di platform Aurovia
 */
export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  'classic-elegance': classicEleganceTemplate,
  'royal-navy-gold': royalNavyGoldTemplate,
  'botanical-garden': botanicalGardenTemplate,
  'modern-minimal': modernMinimalTemplate,
};

/**
 * Mengambil Definisi Template berdasarkan slug unik.
 * Menerapkan fallback aman ke 'classic-elegance' jika slug tidak ditemukan atau null.
 */
export function getTemplateDefinition(slug?: string | null): TemplateDefinition {
  if (!slug) {
    return classicEleganceTemplate;
  }

  const cleanSlug = slug.trim().toLowerCase();
  const definition = TEMPLATE_DEFINITIONS[cleanSlug];

  return definition ?? classicEleganceTemplate;
}

/**
 * Memeriksa apakah slug template terdaftar dalam katalog kode manifest
 */
export function isTemplateDefined(slug: string): boolean {
  if (!slug) return false;
  return Boolean(TEMPLATE_DEFINITIONS[slug.trim().toLowerCase()]);
}

/**
 * Mengambil seluruh definisi template yang tersedia dalam katalog
 */
export function getAllTemplateDefinitions(): TemplateDefinition[] {
  return Object.values(TEMPLATE_DEFINITIONS);
}
