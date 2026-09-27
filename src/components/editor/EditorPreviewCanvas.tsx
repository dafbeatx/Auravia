import React, { useEffect } from 'react';
import { InvitationRenderer } from '@/components/template';
import type { InvitationContent } from '@/lib/template/types';
import type {
  InvitationTemplateConfig,
  InvitationSectionItem,
  InvitationEventItem,
  InvitationGalleryItem,
} from '@/lib/invitations';

export interface EditorPreviewCanvasProps {
  previewDevice: 'desktop' | 'mobile';
  onChangePreviewDevice: (device: 'desktop' | 'mobile') => void;
  liveInvitation: {
    id: string;
    title: string;
    slug: string;
    eventType: string;
    status: string;
    allowRsvp: boolean;
    showWishes: boolean;
    theme_override?: import('@/types/database').Json;
  } | null;
  template?: InvitationTemplateConfig['template'];
  draftSections: InvitationSectionItem[];
  liveContent: InvitationContent;
  draftEvents: InvitationEventItem[];
  draftGallery: InvitationGalleryItem[];
  previewCover: boolean;
  coverPreviewResetKey: number;
  onResetCoverPreview: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  slug: string;
  isPublished: boolean;
}

export const EditorPreviewCanvas: React.FC<EditorPreviewCanvasProps> = ({
  previewDevice,
  onChangePreviewDevice,
  liveInvitation,
  template,
  draftSections,
  liveContent,
  draftEvents,
  draftGallery,
  previewCover,
  coverPreviewResetKey,
  onResetCoverPreview,
  isFullscreen,
  onToggleFullscreen,
  slug,
  isPublished,
}) => {
  // Listen for Escape key to close fullscreen preview
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  const rendererNode = liveInvitation ? (
    <InvitationRenderer
      key={coverPreviewResetKey}
      invitation={liveInvitation}
      template={template}
      customSections={draftSections}
      content={liveContent}
      events={draftEvents}
      gallery={draftGallery}
      mode="editor"
      previewCover={previewCover}
    />
  ) : (
    <div className="py-24 text-center text-xs text-text-muted">
      Menyiapkan pratinjau undangan...
    </div>
  );

  return (
    <>
      {/* 1. KANVAS PRATINJAU UTAMA DI RUANG KERJA EDITOR */}
      <section
        aria-label="Area Pratinjau Undangan"
        className="flex-1 h-full overflow-hidden flex flex-col bg-[#F5F4F0] min-w-0"
      >
        {/* Toolbar Header Pratinjau */}
        <div className="py-2 px-4 bg-surface border-b border-border flex items-center justify-between gap-3 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">
              Pratinjau Langsung
            </span>
            <span className="px-2 py-0.5 rounded border border-border bg-surface-elevated text-[10px] uppercase font-semibold text-text-muted">
              {template?.name ?? 'Classic Elegance'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {previewCover && (
              <button
                type="button"
                onClick={onResetCoverPreview}
                className="py-1 px-2.5 rounded bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Buka kembali sampul amplop"
              >
                Ulangi Animasi Cover
              </button>
            )}

            {isPublished && (
              <a
                href={`/i/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 py-1 px-2.5 rounded bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-text-primary transition-colors cursor-pointer"
                title="Buka halaman publik di tab baru"
              >
                <span>Buka Undangan</span>
                <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="py-1 px-2.5 rounded bg-surface hover:bg-surface-elevated border border-border text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
              title="Perbesar ke layar penuh"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="hidden md:inline">Layar Penuh</span>
            </button>
          </div>
        </div>

        {/* Area Renderer: Desktop vs Realistic Mobile Phone Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          {previewDevice === 'mobile' ? (
            /* Frame Smartphone Realistis */
            <div className="relative w-[390px] h-[780px] max-h-[calc(100vh-140px)] bg-[#1C1917] rounded-[48px] p-3 shadow-2xl border-[4px] border-stone-800 ring-1 ring-black/20 flex flex-col shrink-0 select-text">
              {/* Dynamic Island / Speaker notch */}
              <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800 mr-2" />
                <div className="w-9 h-1 bg-stone-900 rounded-full" />
              </div>

              {/* Layar Ponsel Bagian Dalam */}
              <div className="relative w-full h-full bg-background rounded-[38px] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto pt-6 scrollbar-thin">
                  {rendererNode}
                </div>
              </div>
            </div>
          ) : (
            /* Frame Desktop Web */
            <div className="w-full max-w-4xl h-[780px] max-h-[calc(100vh-140px)] bg-background rounded-xl border border-border shadow-md overflow-hidden flex flex-col select-text">
              {/* Browser Header Bar */}
              <div className="h-8 bg-surface-elevated border-b border-border px-3 flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                </div>
                <div className="flex-1 max-w-xs mx-auto text-center">
                  <span className="text-[11px] text-text-subtle font-mono truncate block">
                    aurovia.id/i/{slug}
                  </span>
                </div>
              </div>

              {/* Layar Konten Desktop */}
              <div className="flex-1 overflow-y-auto">
                {rendererNode}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. MODAL PRATINJAU LAYAR PENUH (FULLSCREEN PREVIEW) */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau Undangan Layar Penuh"
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Top Bar Layar Penuh */}
          <header className="h-12 bg-surface border-b border-border px-4 flex items-center justify-between gap-3 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm font-bold text-text-primary">
                Pratinjau Layar Penuh
              </span>
              <span className="text-xs text-text-muted font-mono">
                /i/{slug}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface-elevated border border-border rounded p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onChangePreviewDevice('desktop')}
                  className={`py-1 px-2.5 rounded transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-surface text-text-primary font-semibold shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => onChangePreviewDevice('mobile')}
                  className={`py-1 px-2.5 rounded transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-surface text-text-primary font-semibold shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Mobile
                </button>
              </div>

              <button
                type="button"
                onClick={onToggleFullscreen}
                className="py-1 px-3 bg-surface hover:bg-surface-elevated border border-border rounded text-xs font-semibold text-text-primary transition-colors cursor-pointer min-h-[32px]"
                aria-label="Tutup Pratinjau Layar Penuh"
              >
                Tutup (Esc)
              </button>
            </div>
          </header>

          {/* Area Konten Fullscreen */}
          <main className="flex-1 overflow-y-auto bg-[#F5F4F0] flex items-center justify-center p-4">
            {previewDevice === 'mobile' ? (
              <div className="relative w-[390px] h-[820px] max-h-[92vh] bg-[#1C1917] rounded-[48px] p-3 shadow-2xl border-[4px] border-stone-800 ring-1 ring-black/20 flex flex-col shrink-0">
                <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800 mr-2" />
                  <div className="w-9 h-1 bg-stone-900 rounded-full" />
                </div>
                <div className="relative w-full h-full bg-background rounded-[38px] overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto pt-6 scrollbar-thin">
                    {rendererNode}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-5xl h-[86vh] bg-background rounded-xl border border-border shadow-lg overflow-y-auto">
                {rendererNode}
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
};
