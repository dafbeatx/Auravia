import type { ComponentType } from 'react';
import type { RegisteredSection, SectionRendererProps, SectionConfig } from './types';
import { HeroSection } from '@/components/template/sections/HeroSection';
import { CoupleSection } from '@/components/template/sections/CoupleSection';
import { EventSection } from '@/components/template/sections/EventSection';
import { StorySection } from '@/components/template/sections/StorySection';
import { GallerySection } from '@/components/template/sections/GallerySection';
import { RsvpSection } from '@/components/template/sections/RsvpSection';
import { WishesSection } from '@/components/template/sections/WishesSection';
import { GiftSection } from '@/components/template/sections/GiftSection';
import { ClosingSection } from '@/components/template/sections/ClosingSection';
import { UnknownSectionFallback } from '@/components/template/sections/UnknownSectionFallback';

/**
 * Peta alias tipe seksi (misal alias database ke tipe kanonikal registry)
 */
export const SECTION_ALIASES: Record<string, string> = {
  hosts: 'couple',
  events: 'event',
};

/**
 * Normalisasi tipe seksi dengan memperhitungkan alias
 */
export function normalizeSectionType(type: string): string {
  const cleanType = type.trim().toLowerCase();
  return SECTION_ALIASES[cleanType] || cleanType;
}

/**
 * Registri Seksi Bawaan MVP Aurovia
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
  },
  {
    type: 'couple',
    name: 'Profil Mempelai',
    description: 'Informasi kedua calon mempelai atau tuan rumah acara.',
    availableVariants: ['cards', 'split', 'stacked'],
    defaultVariant: 'cards',
    component: CoupleSection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'event',
    name: 'Agenda Acara',
    description: 'Rincian waktu, lokasi, dan peta rute acara.',
    availableVariants: ['cards', 'timeline', 'classic'],
    defaultVariant: 'cards',
    component: EventSection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'story',
    name: 'Kisah Kami',
    description: 'Linimasa kisah perjalanan cinta mempelai.',
    availableVariants: ['timeline', 'cards'],
    defaultVariant: 'timeline',
    component: StorySection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'gallery',
    name: 'Galeri Foto',
    description: 'Koleksi dokumentasi foto momen kebahagiaan.',
    availableVariants: ['grid', 'masonry', 'carousel'],
    defaultVariant: 'grid',
    component: GallerySection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'rsvp',
    name: 'Konfirmasi Kehadiran',
    description: 'Formulir konfirmasi kehadiran tamu undangan.',
    availableVariants: ['standard', 'minimal'],
    defaultVariant: 'standard',
    component: RsvpSection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'wishes',
    name: 'Doa & Ucapan',
    description: 'Buku ucapan dan untaian doa dari tamu.',
    availableVariants: ['list', 'wall'],
    defaultVariant: 'list',
    component: WishesSection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'gift',
    name: 'Tanda Kasih',
    description: 'Informasi rekening hadiah pernikahan.',
    availableVariants: ['cards', 'simple'],
    defaultVariant: 'cards',
    component: GiftSection as ComponentType<SectionRendererProps>,
  },
  {
    type: 'closing',
    name: 'Penutup & Salam',
    description: 'Ucapan terima kasih dan salam penutup.',
    availableVariants: ['simple'],
    defaultVariant: 'simple',
    component: ClosingSection as ComponentType<SectionRendererProps>,
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
  registry.set(normalizeSectionType(section.type), section);
}

/**
 * Mengambil metadata seksi terdaftar berdasarkan tipe (mendukung alias).
 */
export function getRegisteredSection(type: string): RegisteredSection | undefined {
  const normalized = normalizeSectionType(type);
  return registry.get(normalized);
}

/**
 * Mengambil komponen renderer seksi berdasarkan tipe.
 * Mengembalikan UnknownSectionFallback secara aman jika seksi belum terdaftar.
 */
export function getSectionComponent(type: string): ComponentType<SectionRendererProps> {
  const section = getRegisteredSection(type);
  return section?.component ?? (UnknownSectionFallback as ComponentType<SectionRendererProps>);
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
