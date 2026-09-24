import type { SectionConfig, TemplateResolutionResult } from './types';
import type { Json } from '@/types/database';
import { normalizeTheme } from './theme';

interface RawDefaultSection {
  type?: string;
  order?: number;
  enabled?: boolean;
  variant?: string;
  config?: Record<string, unknown> | Json;
}

/**
 * Menyelesaikan konfigurasi akhir undangan (Template Resolution):
 * 1. Tema: invitation override > template default > fallback aman.
 * 2. Seksi: invitation_sections > template default_sections.
 * 3. Filter is_enabled = true.
 * 4. Urutkan secara deterministik berdasarkan display_order ASC.
 */
export function resolveTemplateConfig(params: {
  defaultThemeRaw: unknown;
  themeOverrideRaw?: unknown;
  defaultSectionsRaw?: unknown;
  invitationSections?: SectionConfig[] | null;
}): TemplateResolutionResult {
  const { defaultThemeRaw, themeOverrideRaw, defaultSectionsRaw, invitationSections } = params;

  // 1. Resolusi tema terpadu (invitation override > template default)
  const theme = normalizeTheme(defaultThemeRaw, themeOverrideRaw);

  // 2. Resolusi seksi
  let candidateSections: SectionConfig[] = [];

  if (Array.isArray(invitationSections) && invitationSections.length > 0) {
    // Gunakan seksi kustom milik undangan
    candidateSections = invitationSections.map((s) => ({
      id: s.id,
      section_type: s.section_type,
      variant: s.variant || 'default',
      display_order: Number.isFinite(s.display_order) ? s.display_order : 0,
      is_enabled: Boolean(s.is_enabled),
      custom_config: s.custom_config,
    }));
  } else if (Array.isArray(defaultSectionsRaw)) {
    // Fallback ke default_sections dari template master
    candidateSections = (defaultSectionsRaw as RawDefaultSection[])
      .filter((item): item is RawDefaultSection & { type: string } => typeof item?.type === 'string' && item.type.length > 0)
      .map((item, index): SectionConfig => ({
        section_type: item.type,
        variant: typeof item.variant === 'string' ? item.variant : 'default',
        display_order: typeof item.order === 'number' ? item.order : index,
        is_enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
        custom_config: item.config,
      }));
  }

  // 3. Hanya ambil seksi yang aktif (is_enabled = true)
  // 4. Urutkan secara deterministik berdasarkan display_order ASC
  const finalSections = candidateSections
    .filter((s) => s.is_enabled)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    theme,
    sections: finalSections,
  };
}
