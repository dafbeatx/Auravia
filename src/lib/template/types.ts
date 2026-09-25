import type { ComponentType } from 'react';
import type { Tables, Json } from '@/types/database';

export type TemplateRow = Tables<'templates'>;
export type InvitationRow = Tables<'invitations'>;
export type InvitationSectionRow = Tables<'invitation_sections'>;
export type EventRow = Tables<'events'>;
export type GalleryItemRow = Tables<'gallery_items'>;

/**
 * Struktur tema mentah dari templates.default_theme atau invitations.theme_override
 */
export interface TemplateTheme {
  font_heading?: string;
  font_body?: string;
  color_background?: string;
  color_primary?: string;
  color_foreground?: string;
  color_surface?: string;
  color_border?: string;
  color_accent?: string;
}

/**
 * Tema yang telah dinormalisasi dengan nilai fallback aman
 */
export interface NormalizedTheme {
  fontHeading: string;
  fontBody: string;
  colorBackground: string;
  colorForeground: string;
  colorPrimary: string;
  colorSurface: string;
  colorBorder: string;
  colorAccent?: string;
}

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

export interface InvitationContent {
  hero?: InvitationContentHero;
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
 * Kontrak seksi yang terdaftar dalam Section Registry
 */
export interface RegisteredSection<TConfig = Record<string, unknown>> {
  type: string;
  name: string;
  description: string;
  availableVariants: string[];
  defaultVariant: string;
  component: ComponentType<SectionRendererProps<TConfig>>;
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

