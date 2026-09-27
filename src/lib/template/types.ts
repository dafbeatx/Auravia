import type { ComponentType } from 'react';
import type { Tables, Json } from '@/types/database';

export type TemplateRow = Tables<'templates'>;
export type InvitationRow = Tables<'invitations'>;
export type InvitationSectionRow = Tables<'invitation_sections'>;
export type EventRow = Tables<'events'>;
export type GalleryItemRow = Tables<'gallery_items'>;

/**
 * Pilihan gaya sudut tombol (token-based)
 */
export type ButtonRadiusStyle = 'pill' | 'rounded' | 'sharp';

/**
 * Pilihan gaya sudut kartu / panel (token-based)
 */
export type CardRadiusStyle = 'rounded' | 'subtle' | 'sharp';

/**
 * Pilihan dekorasi batas dan aksen (token-based)
 */
export type DecorativeStyle = 'classic' | 'minimal' | 'bordered';

/**
 * Struktur tema kustomisasi undangan (invitations.theme_override)
 */
export interface InvitationThemeOverride {
  font_heading?: string;
  heading_font?: string;
  font_body?: string;
  body_font?: string;
  color_background?: string;
  background?: string;
  color_primary?: string;
  primary?: string;
  color_secondary?: string;
  secondary?: string;
  color_foreground?: string;
  text?: string;
  color_surface?: string;
  surface?: string;
  color_border?: string;
  border?: string;
  color_accent?: string;
  accent?: string;
  color_accent_soft?: string;
  accent_soft?: string;
  color_muted?: string;
  colorMuted?: string;
  button_radius?: ButtonRadiusStyle;
  card_radius?: CardRadiusStyle;
  decorative_style?: DecorativeStyle;
  container_width?: string;
  containerWidth?: string;
}

/**
 * Struktur tema mentah dari templates.default_theme atau invitations.theme_override
 */
export type TemplateTheme = InvitationThemeOverride;

/**
 * Tema yang telah dinormalisasi dengan nilai fallback aman
 */
export interface NormalizedTheme {
  fontHeading: string;
  fontBody: string;
  colorBackground: string;
  colorForeground: string;
  colorPrimary: string;
  colorSecondary?: string;
  colorSurface: string;
  colorBorder: string;
  colorAccent: string;
  colorAccentSoft?: string;
  colorMuted?: string;
  buttonRadius: ButtonRadiusStyle;
  cardRadius: CardRadiusStyle;
  decorativeStyle: DecorativeStyle;
  containerWidth?: string;
}

/**
 * Alias kontrak tema definisi template
 */
export type TemplateThemeDefinition = NormalizedTheme;

/**
 * Konfigurasi terpadu untuk satu seksi undangan
 */
export interface SectionConfig {
  id?: string;
  section_type: string;
  variant: string;
  display_order: number;
  is_enabled: boolean;
  custom_config?: Record<string, unknown> | Json;
}

export interface InvitationContentHero {
  headline?: string;
  opening_text?: string;
  couple_names?: string;
  location_short?: string;
  guest_greeting?: string;
  guestGreeting?: string;
}

export interface InvitationContentHost {
  id?: string;
  name: string;
  role?: string;
  bio?: string;
  parents?: string;
  photo_url?: string;
  storage_path?: string;
}

export interface InvitationContentStoryItem {
  id: string;
  title: string;
  date?: string;
  description: string;
  display_order: number;
  is_enabled: boolean;
}

export interface InvitationContentRsvp {
  title?: string;
  description?: string;
  max_pax_default?: number;
  allow_tentative?: boolean;
  allow_notes?: boolean;
}

export interface InvitationContentGiftAccount {
  id: string;
  type: 'bank' | 'ewallet';
  provider: string;
  account_number: string;
  holder_name: string;
  label?: string;
  display_order: number;
  is_enabled: boolean;
}

export interface InvitationContentGiftAddress {
  recipient_name: string;
  address: string;
  phone?: string;
  notes?: string;
  is_enabled: boolean;
}

export interface InvitationContentGift {
  is_enabled: boolean;
  title?: string;
  description?: string;
  accounts?: InvitationContentGiftAccount[];
  physical_address?: InvitationContentGiftAddress;
}

export interface InvitationContentMusic {
  enabled: boolean;
  title?: string;
  audio_url: string;
  autoplay: boolean;
  loop: boolean;
  volume: number; // 0.0 - 1.0
  start_time?: number; // detik
  source_type?: 'url' | 'storage';
}

export interface InvitationContentCover {
  enabled: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  button_label?: string;
  background_image_url?: string;
  overlay_opacity?: number;
}

export interface InvitationContentQuote {
  enabled?: boolean;
  arabic?: string;
  translation?: string;
  source?: string;
}

export interface InvitationContent {
  hero?: InvitationContentHero;
  quote?: InvitationContentQuote;
  hosts?: InvitationContentHost[];
  story?: InvitationContentStoryItem[];
  financial_accounts?: Array<{ bank_name: string; account_number: string; holder_name?: string }>;
  closing_notes?: string;
  rsvp?: InvitationContentRsvp;
  gift?: InvitationContentGift;
  music?: InvitationContentMusic;
  cover?: InvitationContentCover;
  [key: string]: unknown;
}

/**
 * Properti terpadu yang dipass ke setiap komponen Section Renderer
 */
export interface SectionRendererProps<TConfig = Record<string, unknown>> {
  sectionId?: string;
  sectionType: string;
  variant: string;
  config?: TConfig;
  invitation: {
    id: string;
    slug: string;
    title: string;
    eventType: string;
    status: string;
    allowRsvp?: boolean;
    showWishes?: boolean;
  };
  content?: InvitationContent | null;
  events?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string | null;
    timezone: string;
    venue_name: string;
    address: string | null;
    maps_url: string | null;
    is_primary: boolean;
  }>;
  gallery?: Array<{
    id: string;
    storage_path: string;
    thumbnail_path: string | null;
    caption: string | null;
    display_order: number;
    width: number | null;
    height: number | null;
  }>;
  guest?: {
    id: string;
    name: string;
    pax_limit: number;
    slug: string;
  } | null;
}

/**
 * Kategori template master Aurovia
 */
export type TemplateCategory = 'wedding' | 'birthday' | 'corporate' | 'general';

/**
 * Tipe seksi kanonikal yang didukung oleh platform
 */
export type CanonicalSectionType =
  | 'hero'
  | 'quote'
  | 'couple'
  | 'event'
  | 'story'
  | 'gallery'
  | 'gift'
  | 'rsvp'
  | 'wishes'
  | 'closing';

/**
 * Peta varian seksi: tipe seksi -> nama varian (misal: { hero: 'editorial', couple: 'cards' })
 */
export type SectionVariantMap = Record<string, string>;

/**
 * Konfigurasi sistem dekorasi bawaan template
 */
export interface TemplateDecorativeConfig {
  divider: 'diamond' | 'line' | 'minimal' | 'none';
  monogramFrame: 'classic-ring' | 'none';
}

/**
 * Kapabilitas fungsional yang didukung oleh template
 */
export interface TemplateCapabilities {
  supportsCoverEnvelope: boolean;
  supportsMonogram: boolean;
  supportsCountdown: boolean;
  supportsMusic: boolean;
  bottomNavStyle: 'floating' | 'docked' | 'none';
}

/**
 * Konfigurasi tata letak keseluruhan template
 */
export interface TemplateLayoutConfig {
  maxWidth: '2xl' | '3xl' | '4xl';
  bottomNavStyle: 'floating' | 'docked' | 'none';
}

/**
 * Konfigurasi seksi default dalam template definition
 */
export interface TemplateSectionConfig {
  type: string;
  variant: string;
  order: number;
  enabled: boolean;
  config?: Record<string, unknown>;
}

/**
 * Alias kontrak definisi seksi bawaan
 */
export type SectionDefinition = TemplateSectionConfig;

/**
 * Kontrak terpadu Definisi Template (TemplateDefinition)
 * Menjadi source of truth deklaratif untuk setiap template di Aurovia
 */
export interface TemplateDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  defaultTheme: NormalizedTheme;
  sections: TemplateSectionConfig[];
  capabilities: TemplateCapabilities;
  sectionVariants: SectionVariantMap;
  defaultSectionOrder: string[];

  // Backward-compatible structured metadata
  identity: {
    slug: string;
    name: string;
    category: TemplateCategory;
    description: string;
    thumbnailUrl: string;
    version: string;
  };
  theme: NormalizedTheme;
  decorative: TemplateDecorativeConfig;
  layout: TemplateLayoutConfig;
  defaultVariants: SectionVariantMap;
}

/**
 * Kontrak seksi yang terdaftar dalam Section Registry (Multi-Variant)
 */
export interface RegisteredSection<TConfig = Record<string, unknown>> {
  type: string;
  name: string;
  description: string;
  availableVariants: string[];
  defaultVariant: string;
  component: ComponentType<SectionRendererProps<TConfig>>;
  variants: Record<string, ComponentType<SectionRendererProps<TConfig>>>;
}

/**
 * Hasil resolusi konfigurasi template (Template Resolution Result)
 */
export interface TemplateResolutionResult {
  theme: NormalizedTheme;
  sections: SectionConfig[];
}

/**
 * Data konfigurasi utuh yang dibutuhkan perender undangan
 */
export interface InvitationRenderData {
  invitation: {
    id: string;
    slug: string;
    title: string;
    eventType: string;
    status: string;
    allowRsvp?: boolean;
    showWishes?: boolean;
    themeOverride?: Json;
  };
  template?: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string;
    defaultTheme?: Json;
    defaultSections?: Json;
  } | null;
  sections?: SectionConfig[] | null;
  content?: InvitationContent | null;
  events?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string | null;
    timezone: string;
    venue_name: string;
    address: string | null;
    maps_url: string | null;
    is_primary: boolean;
  }>;
  gallery?: Array<{
    id: string;
    storage_path: string;
    thumbnail_path: string | null;
    caption: string | null;
    display_order: number;
    width: number | null;
    height: number | null;
  }>;
}

