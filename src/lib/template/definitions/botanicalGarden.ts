import type { TemplateDefinition } from '../types';

const defaultTheme = {
  fontHeading: 'Playfair Display',
  fontBody: 'Plus Jakarta Sans',
  colorBackground: '#F4F6F0',
  colorForeground: '#1E3A2F',
  colorPrimary: '#2D4F3F',
  colorSecondary: '#4D725C',
  colorSurface: '#FFFFFF',
  colorBorder: '#D3DDD3',
  colorAccent: '#7A9A7B',
  colorAccentSoft: '#E2ECE2',
  colorMuted: '#526A5E',
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
  divider: 'diamond' as const,
  monogramFrame: 'classic-ring' as const,
  sectionEyebrow: 'diamond' as const,
};

/**
 * Definisi resmi Template Botanical Garden (Aurovia Nature Collection)
 * Desain bernuansa sage green alami dengan estetika dedaunan dan tipografi editorial segar.
 */
export const botanicalGardenTemplate: TemplateDefinition = {
  id: 'botanical-garden',
  slug: 'botanical-garden',
  name: 'Botanical Garden',
  description: 'Desain undangan bernuansa sage green alami dengan estetika dedaunan dan tipografi editorial segar.',
  category: 'wedding',
  defaultTheme,
  sections: defaultSections,
  defaultSections,
  capabilities,
  sectionVariants: defaultVariants,
  coverVariant: 'classic',
  navigationVariant: 'floating',
  typography: {
    heading: 'Playfair Display',
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
    slug: 'botanical-garden',
    name: 'Botanical Garden',
    category: 'wedding',
    description: 'Desain undangan bernuansa sage green alami dengan estetika dedaunan dan tipografi editorial segar.',
    thumbnailUrl: '/templates/botanical-garden/thumbnail.webp',
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
