import type { TemplateDefinition } from '../types';

const defaultTheme = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Plus Jakarta Sans',
  colorBackground: '#FAF9F6',
  colorForeground: '#292524',
  colorPrimary: '#292524',
  colorSecondary: '#78716C',
  colorSurface: '#FFFFFF',
  colorBorder: '#E7E5E0',
  colorAccent: '#292524',
  colorAccentSoft: '#E7E5E0',
  colorMuted: '#78716C',
  buttonRadius: 'pill' as const,
  cardRadius: 'rounded' as const,
  decorativeStyle: 'classic' as const,
  containerWidth: '48rem',
};

const defaultVariants = {
  hero: 'editorial',
  quote: 'islamic',
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
  { type: 'hero', variant: 'editorial', order: 0, enabled: true },
  { type: 'hosts', variant: 'cards', order: 1, enabled: true },
  { type: 'events', variant: 'cards', order: 2, enabled: true },
  { type: 'story', variant: 'timeline', order: 3, enabled: true },
  { type: 'gallery', variant: 'grid', order: 4, enabled: true },
  { type: 'gift', variant: 'cards', order: 5, enabled: true },
  { type: 'rsvp', variant: 'standard', order: 6, enabled: true },
  { type: 'wishes', variant: 'list', order: 7, enabled: true },
  { type: 'closing', variant: 'simple', order: 8, enabled: true },
];

const capabilities = {
  supportsCoverEnvelope: true,
  supportsMonogram: true,
  supportsCountdown: true,
  supportsMusic: true,
  bottomNavStyle: 'floating' as const,
};

/**
 * Definisi resmi Template Classic Elegance (Foundational Template Aurovia)
 * Berorientasi pada tipografi editorial bernuansa serif hangat abadi.
 */
export const classicEleganceTemplate: TemplateDefinition = {
  id: 'classic-elegance',
  slug: 'classic-elegance',
  name: 'Classic Elegance',
  description: 'Desain undangan pernikahan editorial dengan tipografi klasik dan estetika abadi.',
  category: 'wedding',
  defaultTheme,
  sections: defaultSections,
  capabilities,
  sectionVariants: defaultVariants,
  defaultSectionOrder: [
    'hero',
    'hosts',
    'events',
    'story',
    'gallery',
    'gift',
    'rsvp',
    'wishes',
    'closing',
  ],

  // Backward-compatible structured metadata
  identity: {
    slug: 'classic-elegance',
    name: 'Classic Elegance',
    category: 'wedding',
    description: 'Desain undangan pernikahan editorial dengan tipografi klasik dan estetika abadi.',
    thumbnailUrl: '/templates/classic-elegance/thumbnail.webp',
    version: '1.0.0',
  },
  theme: defaultTheme,
  decorative: {
    divider: 'diamond',
    monogramFrame: 'classic-ring',
  },
  layout: {
    maxWidth: '3xl',
    bottomNavStyle: 'floating',
  },
  defaultVariants,
};
