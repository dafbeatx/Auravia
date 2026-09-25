import { useState, useEffect, useMemo } from 'react';
import type { TemplateListItem } from '@/lib/invitations';
import type { InvitationContent, SectionConfig } from '@/lib/template/types';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  template: TemplateListItem | null;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  isSelected: boolean;
}

// Data lokal contoh yang realistis untuk pratinjau desain tanpa query database
const SAMPLE_PREVIEW_CONTENT: InvitationContent = {
  hero: {
    headline: 'Walimatul Ursy',
    opening_text: 'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri perayaan pernikahan kami:',
    couple_names: 'Sarah & Rizky',
    location_short: 'Jakarta, Indonesia',
  },
  hosts: [
    {
      name: 'Sarah Amanda, S.Kom',
      role: 'Mempelai Wanita',
      parents: 'Putri pertama dari Bpk. Bambang & Ibu Nurhayati',
      bio: 'Lulusan Ilmu Komputer Universitas Indonesia',
    },
    {
      name: 'Rizky Pratama, S.T',
      role: 'Mempelai Pria',
      parents: 'Putra kedua dari Bpk. Hartono & Ibu Kartini',
      bio: 'Lulusan Teknik Elektro Institut Teknologi Bandung',
    },
  ],
  story: [
    {
      id: 'story-1',
      title: 'Pertama Bertemu',
      date: '14 Februari 2021',
      description: 'Pertemuan pertama kami dalam sebuah seminar teknologi di Jakarta.',
      display_order: 1,
      is_enabled: true,
    },
    {
      id: 'story-2',
      title: 'Menuju Pelaminan',
      date: '20 Oktober 2023',
      description: 'Komitmen bersama yang disaksikan oleh keluarga kedua belah pihak.',
      display_order: 2,
      is_enabled: true,
    },
  ],
  closing_notes: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
};

const SAMPLE_PREVIEW_EVENTS = [
  {
    id: 'evt-1',
    title: 'Akad Nikah',
    start_time: '2026-10-10T08:00:00+07:00',
    end_time: '2026-10-10T10:00:00+07:00',
    timezone: 'WIB',
    venue_name: 'Masjid Agung Sunda Kelapa',
    address: 'Jl. Taman Sunda Kelapa No.16, Menteng, Jakarta Pusat',
    maps_url: 'https://maps.google.com',
    is_primary: true,
  },
  {
    id: 'evt-2',
    title: 'Resepsi Pernikahan',
    start_time: '2026-10-10T11:00:00+07:00',
    end_time: '2026-10-10T14:00:00+07:00',
    timezone: 'WIB',
    venue_name: 'Plataran Dharmawangsa',
    address: 'Jl. Dharmawangsa Raya No.6, Kebayoran Baru, Jakarta Selatan',
    maps_url: 'https://maps.google.com',
    is_primary: false,
  },
];

const FALLBACK_SECTIONS: SectionConfig[] = [
  { section_type: 'hero', variant: 'default', display_order: 0, is_enabled: true },
  { section_type: 'hosts', variant: 'default', display_order: 1, is_enabled: true },
  { section_type: 'events', variant: 'default', display_order: 2, is_enabled: true },
  { section_type: 'story', variant: 'default', display_order: 3, is_enabled: true },
  { section_type: 'closing', variant: 'default', display_order: 4, is_enabled: true },
];

export function TemplatePreviewModal({
  isOpen,
  template,
  onClose,
  onSelectTemplate,
  isSelected,
}: TemplatePreviewModalProps) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  // Tutup modal jika tombol Escape ditekan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Siapkan objek undangan lokal untuk InvitationRenderer
  const previewInvitation = useMemo(() => {
    if (!template) return null;
    return {
      id: 'preview-invitation-instance',
      title: template.name,
      slug: template.slug,
      status: 'draft',
      event_type: 'Pernikahan',
      allow_rsvp: true,
      show_wishes: true,
      theme_override: template.default_theme,
    };
  }, [template]);

  // Siapkan konfigurasi template untuk InvitationRenderer
  const previewTemplate = useMemo(() => {
    if (!template) return null;
    return {
      id: template.id,
      slug: template.slug,
      name: template.name,
      category: template.category,
      description: template.description,
      default_theme: template.default_theme,
      default_sections: template.default_sections,
    };
  }, [template]);

  if (!isOpen || !template || !previewInvitation) return null;

  const handleUseDesign = () => {
    onSelectTemplate(template.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header Pratinjau */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border flex items-center justify-between gap-3 bg-surface flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Kembali ke pemilihan template"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 id="template-preview-title" className="font-serif text-base sm:text-lg font-bold text-primary truncate">
                Pratinjau: {template.name}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                <span className="capitalize">{template.category}</span>
                <span>•</span>
                <span>Desain Tipografi Asli</span>
              </div>
            </div>
          </div>

          {/* Sakelar Tampilan Perangkat & Tombol Pilih */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Switcher Layar Lebar vs Layar Ponsel */}
            <div className="hidden sm:flex items-center gap-1 bg-surface-elevated border border-border rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                  deviceView === 'desktop'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('mobile')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                  deviceView === 'mobile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Ponsel</span>
              </button>
            </div>

            {/* Tombol Gunakan Desain Ini */}
            <button
              type="button"
              onClick={handleUseDesign}
              className="px-4 sm:px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[44px] inline-flex items-center gap-1.5"
            >
              {isSelected ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Desain Terpilih</span>
                </>
              ) : (
                <span>Gunakan Desain Ini</span>
              )}
            </button>
          </div>
        </div>

        {/* Kontainer Pratinjau Interaktif */}
        <div className="flex-1 overflow-y-auto bg-stone-100 p-2 sm:p-6 flex justify-center items-start">
          <div
            className={`transition-all duration-300 w-full ${
              deviceView === 'mobile'
                ? 'max-w-[400px] border-[6px] border-stone-800 rounded-[32px] shadow-2xl overflow-hidden bg-background my-2'
                : 'max-w-4xl border border-border rounded-xl shadow-md overflow-hidden bg-background'
            }`}
          >
            {/* Header simulasi mockup smartphone jika tampilan ponsel */}
            {deviceView === 'mobile' && (
              <div className="h-6 bg-stone-800 flex items-center justify-center select-none">
                <div className="w-16 h-3 bg-stone-900 rounded-full" />
              </div>
            )}

            {/* Renderer Undangan Asli */}
            <div className="min-h-[500px]">
              <InvitationRenderer
                invitation={previewInvitation}
                template={previewTemplate}
                customSections={Array.isArray(template.default_sections) ? undefined : FALLBACK_SECTIONS}
                content={SAMPLE_PREVIEW_CONTENT}
                events={SAMPLE_PREVIEW_EVENTS}
                mode="editor"
                previewCover={false}
              />
            </div>
          </div>
        </div>

        {/* Footer Bar Keterangan */}
        <div className="px-4 py-2.5 sm:px-6 bg-surface-elevated border-t border-border flex items-center justify-between text-xs text-text-muted flex-shrink-0">
          <p className="line-clamp-1 text-[11px]">
            {template.description || 'Desain undangan pernikahan editorial dengan tipografi klasik dan estetika abadi.'}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-text-subtle font-mono">Tekan ESC untuk menutup</span>
            <button
              type="button"
              onClick={handleUseDesign}
              className="font-semibold text-primary hover:underline cursor-pointer sm:hidden text-xs"
            >
              Gunakan Desain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
