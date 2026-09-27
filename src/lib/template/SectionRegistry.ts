import type { ComponentType } from 'react';
import type { RegisteredSection, SectionRendererProps, SectionConfig, TemplateDefinition } from './types';
import { HeroSection } from '@/components/template/sections/HeroSection';
import { CoupleSection } from '@/components/template/sections/CoupleSection';
import { EventSection } from '@/components/template/sections/EventSection';
import { StorySection } from '@/components/template/sections/StorySection';
import { GallerySection } from '@/components/template/sections/GallerySection';
import { RsvpSection } from '@/components/template/sections/RsvpSection';
import { WishesSection } from '@/components/template/sections/WishesSection';
import { GiftSection } from '@/components/template/sections/GiftSection';
import { QuoteSection } from '@/components/template/sections/QuoteSection';
import { ClosingSection } from '@/components/template/sections/ClosingSection';
import { UnknownSectionFallback } from '@/components/template/sections/UnknownSectionFallback';

/**
 * Peta alias tipe seksi (misal alias database ke tipe kanonikal registry)
 */
export const SECTION_ALIASES: Record<string, string> = {
  hosts: 'couple',
  events: 'event',
  quran: 'quote',
  verse: 'quote',
};

/**
 * Normalisasi tipe seksi dengan memperhitungkan alias
 */
export function normalizeSectionType(type: string): string {
  const cleanType = type.trim().toLowerCase();
  return SECTION_ALIASES[cleanType] || cleanType;
}

/**
 * Registri Seksi Bawaan Aurovia (Multi-Variant)
 */
const registry: Map<string, RegisteredSection> = new Map();

export const INITIAL_SECTIONS: RegisteredSection[] = [
  {
    type: 'hero',
    name: 'Hero Cover',
    description: 'Header pembuka undangan dengan judul dan waktu acara utama.',
    availableVariants: ['editorial', 'centered', 'minimal'],
    defaultVariant: 'editorial',
    component: HeroSection as ComponentType<SectionRendererProps>,
    variants: {
      default: HeroSection as ComponentType<SectionRendererProps>,
      editorial: HeroSection as ComponentType<SectionRendererProps>,
      centered: HeroSection as ComponentType<SectionRendererProps>,
      minimal: HeroSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'quote',
    name: 'Kutipan & Ayat',
    description: 'Untaian ayat suci atau kutipan mutiara pernikahan.',
    availableVariants: ['islamic', 'minimal', 'card'],
    defaultVariant: 'islamic',
    component: QuoteSection as ComponentType<SectionRendererProps>,
    variants: {
      default: QuoteSection as ComponentType<SectionRendererProps>,
      islamic: QuoteSection as ComponentType<SectionRendererProps>,
      minimal: QuoteSection as ComponentType<SectionRendererProps>,
      card: QuoteSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'couple',
    name: 'Profil Mempelai',
    description: 'Informasi kedua calon mempelai atau tuan rumah acara.',
    availableVariants: ['cards', 'split', 'stacked'],
    defaultVariant: 'cards',
    component: CoupleSection as ComponentType<SectionRendererProps>,
    variants: {
      default: CoupleSection as ComponentType<SectionRendererProps>,
      cards: CoupleSection as ComponentType<SectionRendererProps>,
      split: CoupleSection as ComponentType<SectionRendererProps>,
      stacked: CoupleSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'event',
    name: 'Agenda Acara',
    description: 'Rincian waktu, lokasi, dan peta rute acara.',
    availableVariants: ['cards', 'timeline', 'classic'],
    defaultVariant: 'cards',
    component: EventSection as ComponentType<SectionRendererProps>,
    variants: {
      default: EventSection as ComponentType<SectionRendererProps>,
      cards: EventSection as ComponentType<SectionRendererProps>,
      timeline: EventSection as ComponentType<SectionRendererProps>,
      classic: EventSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'story',
    name: 'Kisah Kami',
    description: 'Linimasa kisah perjalanan cinta mempelai.',
    availableVariants: ['timeline', 'cards'],
    defaultVariant: 'timeline',
    component: StorySection as ComponentType<SectionRendererProps>,
    variants: {
      default: StorySection as ComponentType<SectionRendererProps>,
      timeline: StorySection as ComponentType<SectionRendererProps>,
      cards: StorySection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'gallery',
    name: 'Galeri Foto',
    description: 'Koleksi dokumentasi foto momen kebahagiaan.',
    availableVariants: ['grid', 'masonry', 'carousel'],
    defaultVariant: 'grid',
    component: GallerySection as ComponentType<SectionRendererProps>,
    variants: {
      default: GallerySection as ComponentType<SectionRendererProps>,
      grid: GallerySection as ComponentType<SectionRendererProps>,
      masonry: GallerySection as ComponentType<SectionRendererProps>,
      carousel: GallerySection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'rsvp',
    name: 'Konfirmasi Kehadiran',
    description: 'Formulir konfirmasi kehadiran tamu undangan.',
    availableVariants: ['standard', 'minimal'],
    defaultVariant: 'standard',
    component: RsvpSection as ComponentType<SectionRendererProps>,
    variants: {
      default: RsvpSection as ComponentType<SectionRendererProps>,
      standard: RsvpSection as ComponentType<SectionRendererProps>,
      minimal: RsvpSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'wishes',
    name: 'Doa & Ucapan',
    description: 'Buku ucapan dan untaian doa dari tamu.',
    availableVariants: ['list', 'wall'],
    defaultVariant: 'list',
    component: WishesSection as ComponentType<SectionRendererProps>,
    variants: {
      default: WishesSection as ComponentType<SectionRendererProps>,
      list: WishesSection as ComponentType<SectionRendererProps>,
      wall: WishesSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'gift',
    name: 'Tanda Kasih',
    description: 'Informasi rekening hadiah pernikahan.',
    availableVariants: ['cards', 'simple'],
    defaultVariant: 'cards',
    component: GiftSection as ComponentType<SectionRendererProps>,
    variants: {
      default: GiftSection as ComponentType<SectionRendererProps>,
      cards: GiftSection as ComponentType<SectionRendererProps>,
      simple: GiftSection as ComponentType<SectionRendererProps>,
    },
  },
  {
    type: 'closing',
    name: 'Penutup & Salam',
    description: 'Ucapan terima kasih dan salam penutup.',
    availableVariants: ['simple'],
    defaultVariant: 'simple',
    component: ClosingSection as ComponentType<SectionRendererProps>,
    variants: {
      default: ClosingSection as ComponentType<SectionRendererProps>,
      simple: ClosingSection as ComponentType<SectionRendererProps>,
    },
  },
];

// Inisialisasi seksi ke dalam registry
INITIAL_SECTIONS.forEach((section) => {
  registry.set(section.type, section);
});

/**
 * Mendaftarkan seksi baru atau memperbarui seksi yang ada (extensible).
 */
export function registerSection(section: RegisteredSection): void {
  const normalized = normalizeSectionType(section.type);
  registry.set(normalized, section);
}

/**
 * Mendaftarkan varian komponen spesifik ke dalam tipe seksi yang sudah ada.
 */
export function registerSectionVariant(
  type: string,
  variantName: string,
  component: ComponentType<SectionRendererProps>
): void {
  const normalized = normalizeSectionType(type);
  const cleanVariant = variantName.trim().toLowerCase();
  const existing = registry.get(normalized);

  if (existing) {
    existing.variants[cleanVariant] = component;
    if (!existing.availableVariants.includes(cleanVariant)) {
      existing.availableVariants.push(cleanVariant);
    }
  } else {
    registry.set(normalized, {
      type: normalized,
      name: normalized,
      description: `Seksi kustom ${normalized}`,
      availableVariants: [cleanVariant],
      defaultVariant: cleanVariant,
      component,
      variants: {
        default: component,
        [cleanVariant]: component,
      },
    });
  }
}

/**
 * Mengambil metadata seksi terdaftar berdasarkan tipe (mendukung alias).
 */
export function getRegisteredSection(type: string): RegisteredSection | undefined {
  const normalized = normalizeSectionType(type);
  return registry.get(normalized);
}

/**
 * Mengambil komponen renderer seksi berdasarkan tipe dan varian spesifik (Multi-Variant Engine).
 *
 * Alur Fallback Deterministik:
 * 1. requested variant (jika ada dan cocok di dictionary variants)
 * 2. fallbackDefaultVariant (dari TemplateDefinition aktif)
 * 3. section defaultVariant (bawaan registrasi seksi)
 * 4. variant 'default'
 * 5. first available variant di dictionary
 * 6. UnknownSectionFallback jika seksi tidak dikenal
 */
export function getSectionVariantComponent(
  type: string,
  variant?: string,
  templateDefinitionOrFallback?: TemplateDefinition | string
): ComponentType<SectionRendererProps> {
  const section = getRegisteredSection(type);
  if (!section) {
    return UnknownSectionFallback as ComponentType<SectionRendererProps>;
  }

  // 1. Requested variant
  if (variant) {
    const cleanVariant = variant.trim().toLowerCase();
    const candidate = section.variants[cleanVariant];
    if (candidate) {
      return candidate;
    }
  }

  // 2. Fallback default variant dari TemplateDefinition aktif
  let fallbackDefaultVariant: string | undefined;
  if (typeof templateDefinitionOrFallback === 'string') {
    fallbackDefaultVariant = templateDefinitionOrFallback;
  } else if (templateDefinitionOrFallback && typeof templateDefinitionOrFallback === 'object') {
    const normType = normalizeSectionType(type);
    fallbackDefaultVariant =
      templateDefinitionOrFallback.sectionVariants?.[type] ||
      templateDefinitionOrFallback.sectionVariants?.[normType] ||
      templateDefinitionOrFallback.defaultVariants?.[type] ||
      templateDefinitionOrFallback.defaultVariants?.[normType] ||
      templateDefinitionOrFallback.sections?.find(
        (s) => s.type === type || normalizeSectionType(s.type) === normType
      )?.variant;
  }

  if (fallbackDefaultVariant) {
    const cleanFallback = fallbackDefaultVariant.trim().toLowerCase();
    const candidate = section.variants[cleanFallback];
    if (candidate) {
      return candidate;
    }
  }

  // 3. Section defaultVariant (bawaan registrasi seksi)
  const defaultCandidate = section.variants[section.defaultVariant];
  if (defaultCandidate) {
    return defaultCandidate;
  }

  // 4. Variant 'default'
  const fallbackCandidate = section.variants['default'];
  if (fallbackCandidate) {
    return fallbackCandidate;
  }

  // 5. First available variant di dictionary
  const firstAvailable = Object.values(section.variants)[0];
  if (firstAvailable) {
    return firstAvailable;
  }

  // 6. Existing fallback component
  if (section.component) {
    return section.component;
  }

  return UnknownSectionFallback as ComponentType<SectionRendererProps>;
}

/**
 * Mengambil komponen renderer seksi berdasarkan tipe (backward-compatible).
 * Mendukung parameter opsional variant.
 */
export function getSectionComponent(
  type: string,
  variant?: string
): ComponentType<SectionRendererProps> {
  return getSectionVariantComponent(type, variant);
}

/**
 * Mengecek apakah tipe seksi telah terdaftar dalam registry.
 */
export function isSectionRegistered(type: string): boolean {
  return registry.has(normalizeSectionType(type));
}

/**
 * Mengambil seluruh seksi yang terdaftar dalam registry.
 */
export function getAllRegisteredSections(): RegisteredSection[] {
  return Array.from(registry.values());
}

/**
 * Menggabungkan seksi default template dan konfigurasi seksi undangan:
 * 1. Jika ada customSections dari invitation_sections, gunakan itu.
 * 2. Jika tidak ada, gunakan defaultSections dari templates.default_sections.
 * 3. Filter hanya yang is_enabled = true.
 * 4. Urutkan berdasarkan display_order menaik (ASC).
 */
export function resolveSections(
  defaultSectionsRaw?: unknown,
  customSections?: SectionConfig[] | null
): SectionConfig[] {
  if (Array.isArray(customSections) && customSections.length > 0) {
    return customSections
      .filter((s) => s.is_enabled)
      .sort((a, b) => a.display_order - b.display_order);
  }

  if (Array.isArray(defaultSectionsRaw)) {
    interface RawSection {
      type?: string;
      order?: number;
      enabled?: boolean;
      variant?: string;
      config?: Record<string, unknown> | import('@/types/database').Json;
    }

    return (defaultSectionsRaw as RawSection[])
      .filter((item): item is RawSection & { type: string } => typeof item?.type === 'string' && item.type.length > 0)
      .map((item, index): SectionConfig => ({
        section_type: item.type,
        variant: typeof item.variant === 'string' ? item.variant : 'default',
        display_order: typeof item.order === 'number' ? item.order : index,
        is_enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
        custom_config: item.config,
      }))
      .filter((s) => s.is_enabled)
      .sort((a, b) => a.display_order - b.display_order);
  }

  return [];
}
