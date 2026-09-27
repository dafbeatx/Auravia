import React, { useMemo } from 'react';
import type { SectionConfig } from '@/lib/template/types';
import type { Json } from '@/types/database';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { getSectionVariantComponent } from '@/lib/template/SectionRegistry';
import { getTemplateDefinition } from '@/lib/template/definitions';
import { ThemeInjector } from './ThemeInjector';
import { UnknownSectionFallback } from './sections/UnknownSectionFallback';
import { MusicPlayer } from './MusicPlayer';
import { CoverEnvelope } from './CoverEnvelope';

export interface InvitationRendererProps {
  invitation: {
    id: string;
    title: string;
    slug: string;
    event_type?: string;
    eventType?: string;
    status: string;
    allow_rsvp?: boolean;
    allowRsvp?: boolean;
    show_wishes?: boolean;
    showWishes?: boolean;
    theme_override?: Json;
    themeOverride?: Json;
  };
  template?: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string;
    default_theme?: Json;
    defaultTheme?: Json;
    default_sections?: Json;
    defaultSections?: Json;
  } | null;
  customSections?: SectionConfig[] | null;
  sections?: SectionConfig[] | null;
  content?: import('@/lib/template/types').InvitationContent | null;
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
  className?: string;
  mode?: 'public' | 'editor';
  previewCover?: boolean;
}

/**
 * Komponen utama InvitationRenderer (Presentation-Only):
 * Menerjemahkan konfigurasi template, tema, dan urutan seksi menjadi antarmuka undangan nyata.
 * Mendukung Cover Envelope Experience pada mode publik dan pratinjau editor yang responsif.
 */
export const InvitationRenderer: React.FC<InvitationRendererProps> = ({
  invitation,
  template,
  customSections,
  sections,
  content,
  events,
  gallery,
  guest,
  className = '',
  mode = 'public',
  previewCover = false,
}) => {
  const [isCoverOpen, setIsCoverOpen] = React.useState(false);

  // Evaluasi apakah Cover Envelope harus ditampilkan
  const isCoverActive = useMemo(() => {
    if (mode === 'editor') {
      return Boolean(previewCover);
    }
    // Pada halaman publik, cover aktif jika tidak dimatikan eksplisit (default true)
    return content?.cover?.enabled !== false;
  }, [mode, previewCover, content?.cover?.enabled]);

  // Sinkronisasi status cover jika mode preview pada editor berubah
  React.useEffect(() => {
    if (mode === 'editor' && previewCover) {
      setIsCoverOpen(false);
    }
  }, [mode, previewCover]);
  // Normalisasi properti invitation
  const normalizedInvitation = useMemo(() => {
    return {
      id: invitation.id,
      title: invitation.title,
      slug: invitation.slug,
      eventType: invitation.eventType || invitation.event_type || 'Pernikahan',
      status: invitation.status,
      allowRsvp:
        typeof invitation.allowRsvp === 'boolean'
          ? invitation.allowRsvp
          : typeof invitation.allow_rsvp === 'boolean'
          ? invitation.allow_rsvp
          : true,
      showWishes:
        typeof invitation.showWishes === 'boolean'
          ? invitation.showWishes
          : typeof invitation.show_wishes === 'boolean'
          ? invitation.show_wishes
          : true,
    };
  }, [invitation]);

  // Resolusi konfigurasi tema dan seksi terpadu:
  // invitation override > template default > fallback aman
  const { theme, sections: activeSections } = useMemo(() => {
    const defaultThemeRaw = template?.defaultTheme ?? template?.default_theme;
    const themeOverrideRaw = invitation.themeOverride ?? invitation.theme_override;
    const defaultSectionsRaw = template?.defaultSections ?? template?.default_sections;
    const invitationSections = customSections ?? sections;

    return resolveTemplateConfig({
      defaultThemeRaw,
      themeOverrideRaw,
      defaultSectionsRaw,
      invitationSections,
    });
  }, [
    template?.defaultTheme,
    template?.default_theme,
    template?.defaultSections,
    template?.default_sections,
    invitation.themeOverride,
    invitation.theme_override,
    customSections,
    sections,
  ]);

  // Resolusi TemplateDefinition aktif di memori (in-memory manifest catalog)
  const templateDefinition = useMemo(() => {
    return getTemplateDefinition(template?.slug);
  }, [template?.slug]);

  return (
    <ThemeInjector theme={theme} className={`relative ${className}`} as="article">
      {/* Cover Envelope Experience */}
      {isCoverActive && !isCoverOpen && (
        <CoverEnvelope
          cover={content?.cover}
          invitation={normalizedInvitation}
          content={content}
          events={events}
          guest={guest}
          containerPosition={mode === 'editor' ? 'absolute' : 'fixed'}
          onOpen={() => setIsCoverOpen(true)}
        />
      )}

      <main className="w-full min-h-screen pb-24 md:pb-12">
        {activeSections.length === 0 ? (
          <div className="py-24 text-center px-4">
            <p className="text-xs text-[var(--theme-color-primary)]/60">
              Belum ada seksi undangan yang diaktifkan.
            </p>
          </div>
        ) : (
          activeSections.map((section, idx) => {
            // Guard: RSVP hanya dirender jika allowRsvp aktif
            if (section.section_type === 'rsvp' && !normalizedInvitation.allowRsvp) {
              return null;
            }

            // Guard: Doa & Ucapan hanya dirender jika showWishes aktif
            if (section.section_type === 'wishes' && !normalizedInvitation.showWishes) {
              return null;
            }

            // Guard: Hadiah hanya dirender jika fitur aktif dan ada data rekening / alamat
            if (section.section_type === 'gift') {
              const giftConfig = content?.gift;
              const isGiftExplicitlyDisabled = giftConfig?.is_enabled === false;
              const hasLegacyAccounts =
                Array.isArray(content?.financial_accounts) && content.financial_accounts.length > 0;
              const hasAccounts =
                Array.isArray(giftConfig?.accounts) &&
                giftConfig.accounts.some((a) => a.is_enabled !== false);
              const hasAddress = Boolean(
                giftConfig?.physical_address?.is_enabled &&
                  giftConfig?.physical_address?.address?.trim()
              );

              if (isGiftExplicitlyDisabled || (!hasAccounts && !hasAddress && !hasLegacyAccounts)) {
                return null;
              }
            }

            const SectionComponent = getSectionVariantComponent(
              section.section_type,
              section.variant,
              templateDefinition
            );
            const sectionKey = section.id || `${section.section_type}-${idx}`;

            if (!SectionComponent) {
              return (
                <UnknownSectionFallback
                  key={sectionKey}
                  sectionType={section.section_type}
                  variant={section.variant}
                  invitation={normalizedInvitation}
                />
              );
            }

            return (
              <SectionComponent
                key={sectionKey}
                sectionId={section.id}
                sectionType={section.section_type}
                variant={section.variant}
                config={section.custom_config as Record<string, unknown> | undefined}
                invitation={normalizedInvitation}
                content={content}
                events={events}
                gallery={gallery}
                guest={guest}
              />
            );
          })
        )}
      </main>

      {/* Floating Mobile Bottom Navigation Bar */}
      {templateDefinition.capabilities.bottomNavStyle !== 'none' &&
        (!isCoverActive || isCoverOpen) &&
        activeSections.length > 1 && (
        <nav
          aria-label="Navigasi Seksi Undangan"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-sm md:hidden bg-[var(--theme-color-surface)]/95 backdrop-blur-md border border-[var(--theme-color-border)]/40 rounded-full shadow-lg px-2 py-1 flex items-center justify-around select-none"
        >
          {activeSections.some((s) => s.section_type === 'hero') && (
            <button
              type="button"
              onClick={() => {
                document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju Sampul"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
              </svg>
              <span>Cover</span>
            </button>
          )}

          {activeSections.some((s) => s.section_type === 'couple' || s.section_type === 'hosts') && (
            <button
              type="button"
              onClick={() => {
                document.getElementById('couple')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju Mempelai"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Mempelai</span>
            </button>
          )}

          {activeSections.some((s) => s.section_type === 'event' || s.section_type === 'events') && (
            <button
              type="button"
              onClick={() => {
                document.getElementById('event')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju Acara"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Acara</span>
            </button>
          )}

          {activeSections.some((s) => s.section_type === 'gallery') && (
            <button
              type="button"
              onClick={() => {
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju Galeri"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Galeri</span>
            </button>
          )}

          {activeSections.some((s) => s.section_type === 'gift') && (
            <button
              type="button"
              onClick={() => {
                document.getElementById('gift')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju Kado"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V4a2 2 0 10-4 0v4m4 0V4a2 2 0 114 0v4m-8 0H4a1 1 0 00-1 1v3a1 1 0 001 1h16a1 1 0 001-1V9a1 1 0 00-1-1h-4m-10 5v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
              </svg>
              <span>Kado</span>
            </button>
          )}

          {(activeSections.some((s) => s.section_type === 'rsvp') || activeSections.some((s) => s.section_type === 'wishes')) && (
            <button
              type="button"
              onClick={() => {
                const target = document.getElementById('rsvp') || document.getElementById('wishes');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] py-1 text-[9px] font-medium text-[var(--theme-color-primary)]/75 hover:text-[var(--theme-color-accent)] focus:outline-none transition-colors cursor-pointer"
              aria-label="Menuju RSVP dan Ucapan"
            >
              <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Ucapan</span>
            </button>
          )}
        </nav>
      )}

      {/* Floating Background Music Player */}
      <MusicPlayer music={content?.music} />
    </ThemeInjector>
  );
};
