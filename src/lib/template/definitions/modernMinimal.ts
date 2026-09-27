import type { TemplateDefinition } from '../types';

const defaultTheme = {
  fontHeading: 'Outfit',
  fontBody: 'Plus Jakarta Sans',
  colorBackground: '#F8F9FA',
  colorForeground: '#0F172A',
  colorPrimary: '#006A71',
  colorSecondary: '#48A6A7',
  colorSurface: '#FFFFFF',
  colorBorder: '#E2E8F0',
  colorAccent: '#006A71',
  colorAccentSoft: '#E6F4F5',
  colorMuted: '#64748B',
  buttonRadius: 'rounded' as const,
  cardRadius: 'rounded' as const,
  decorativeStyle: 'minimal' as const,
  containerWidth: '48rem',
};

const defaultVariants = {
  hero: 'minimal',
  quote: 'minimal',
  couple: 'cards',
  hosts: 'cards',
  event: 'cards',
  events: 'cards',
  story: 'timeline',
  gallery: 'grid',
  gift: 'cards',
  rsvp: 'standard',
  wishes: 'list',
  closing: 'simple',
};

const defaultSections = [
  { type: 'hero', variant: 'minimal', order: 0, enabled: true },
  { type: 'hosts', variant: 'cards', order: 1, enabled: true },
  { type: 'events', variant: 'cards', order: 2, enabled: true },
  { type: 'story', variant: 'timeline', order: 3, enabled: true },
  { type: 'gallery', variant: 'grid', order: 4, enabled: true },
  { type: 'gift', variant: 'cards', order: 5, enabled: true },
  { type: 'rsvp', variant: 'standard', order: 6, enabled: true },
  { type: 'closing', variant: 'simple', order: 7, enabled: true },
];

const capabilities = {
  supportsCoverEnvelope: true,
  supportsMonogram: true,
  supportsCountdown: true,
  supportsMusic: true,
  coverEnvelope: true,
  countdown: true,
  musicPlayer: true,
  bottomNavigation: true,
  gallery: true,
  rsvp: true,
  wishes: true,
  gift: true,
  story: true,
  multipleEvents: true,
  bottomNavStyle: 'floating' as const,
};

const ornaments = {
  divider: 'minimal' as const,
  monogramFrame: 'minimal' as const,
  sectionEyebrow: 'minimal' as const,
};

/**
 * Definisi resmi Template Modern Minimal (Aurovia Contemporary Collection)
 * Garis bersih, tipografi kontemporer, dan ruang terbuka luas yang berfokus pada esensi momen.
 */
export const modernMinimalTemplate: TemplateDefinition = {
  id: 'modern-minimal',
  slug: 'modern-minimal',
  name: 'Modern Minimal',
  description: 'Desain undangan modern dengan garis bersih, ruang terbuka luas, dan fokus pada keanggunan tipografi.',
  category: 'wedding',
  defaultTheme,
  sections: defaultSections,
  defaultSections,
  capabilities,
  sectionVariants: defaultVariants,
  coverVariant: 'classic',
  navigationVariant: 'floating',
  typography: {
    heading: 'Outfit',
    body: 'Plus Jakarta Sans',
  },
  ornaments,
  defaultSectionOrder: [
    'hero',
    'hosts',
    'events',
    'story',
    'gallery',
    'gift',
    'rsvp',
    'closing',
  ],

  identity: {
    slug: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'wedding',
    description: 'Desain undangan modern dengan garis bersih, ruang terbuka luas, dan fokus pada keanggunan tipografi.',
    thumbnailUrl: '/templates/modern-minimal/thumbnail.webp',
    version: '1.0.0',
  },
  theme: defaultTheme,
  decorative: ornaments,
  layout: {
    maxWidth: '3xl',
    bottomNavStyle: 'floating',
  },
  defaultVariants,
};
