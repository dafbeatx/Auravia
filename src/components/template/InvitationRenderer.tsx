import React, { useMemo } from 'react';
import type { SectionConfig } from '@/lib/template/types';
import type { Json } from '@/types/database';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { getSectionComponent } from '@/lib/template/SectionRegistry';
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

      <main className="w-full min-h-screen">
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

            const SectionComponent = getSectionComponent(section.section_type);
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

      {/* Floating Background Music Player */}
      <MusicPlayer music={content?.music} />
    </ThemeInjector>
  );
};
