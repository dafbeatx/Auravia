import type { TemplateDefinition } from '../types';

const defaultTheme = {
  fontHeading: 'Playfair Display',
  fontBody: 'Outfit',
  colorBackground: '#0A1324',
  colorForeground: '#F8FAFC',
  colorPrimary: '#F8FAFC',
  colorSecondary: '#1E3A5F',
  colorSurface: '#132238',
  colorBorder: '#D4AF37',
  colorAccent: '#D4AF37',
  colorAccentSoft: '#F6E09C',
  colorMuted: '#94A3B8',
  buttonRadius: 'pill' as const,
  cardRadius: 'rounded' as const,
  decorativeStyle: 'classic' as const,
  containerWidth: '48rem',
};

const defaultVariants = {
  hero: 'royal',
  quote: 'islamic',
  couple: 'royal',
  hosts: 'royal',
  event: 'royal',
  events: 'royal',
  story: 'timeline',
  gallery: 'royal',
  gift: 'royal',
  rsvp: 'royal',
  wishes: 'royal',
  closing: 'royal',
};

const defaultSections = [
  { type: 'hero', variant: 'royal', order: 0, enabled: true },
  { type: 'hosts', variant: 'royal', order: 1, enabled: true },
  { type: 'events', variant: 'royal', order: 2, enabled: true },
  { type: 'story', variant: 'timeline', order: 3, enabled: true },
  { type: 'gallery', variant: 'royal', order: 4, enabled: true },
  { type: 'gift', variant: 'royal', order: 5, enabled: true },
  { type: 'rsvp', variant: 'royal', order: 6, enabled: true },
  { type: 'closing', variant: 'royal', order: 7, enabled: true },
];

const capabilities = {
  countdown: true,
  coverEnvelope: true,
  musicPlayer: true,
  bottomNavigation: true,
  gallery: true,
  rsvp: true,
  wishes: true,
  gift: true,
  story: true,
  multipleEvents: true,
  supportsCoverEnvelope: true,
  supportsMonogram: true,
  supportsCountdown: true,
  supportsMusic: true,
  bottomNavStyle: 'floating' as const,
};

const ornaments = {
  divider: 'gold' as const,
  monogramFrame: 'royal-circle' as const,
  sectionEyebrow: 'royal' as const,
};

/**
 * Definisi resmi Template Royal Navy & Gold (Aurovia Premium Collection)
 * Desain bernuansa biru dongker megah dengan aksen emas berwibawa,
 * perpaduan tipografi Playfair Display yang agung dan Outfit yang bersih dan modern.
 */
export const royalNavyGoldTemplate: TemplateDefinition = {
  id: 'royal-navy-gold',
  slug: 'royal-navy-gold',
  name: 'Royal Navy & Gold',
  description: 'Desain undangan pernikahan megah dan khidmat dengan nuansa navy kerajaan dan aksen emas klasik.',
  category: 'wedding',
  defaultTheme,
  sections: defaultSections,
  defaultSections,
  capabilities,
  sectionVariants: defaultVariants,
  coverVariant: 'royal',
  navigationVariant: 'floating',
  typography: {
    heading: 'Playfair Display',
    body: 'Outfit',
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

  // Structured metadata
  identity: {
    slug: 'royal-navy-gold',
    name: 'Royal Navy & Gold',
    category: 'wedding',
    description: 'Desain undangan pernikahan megah dan khidmat dengan nuansa navy kerajaan dan aksen emas klasik.',
    thumbnailUrl: '/templates/royal-navy-gold/thumbnail.webp',
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
