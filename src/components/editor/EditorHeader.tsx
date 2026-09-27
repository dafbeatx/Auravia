import React, { useState, useRef, useEffect } from 'react';

export interface EditorHeaderProps {
  title: string;
  slug: string;
  status: 'draft' | 'published';
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  linkCopied: boolean;
  mobileView: 'editor' | 'preview';
  onToggleMobileView: () => void;
  previewDevice: 'desktop' | 'mobile';
  onChangePreviewDevice: (device: 'desktop' | 'mobile') => void;
  onToggleFullscreen: () => void;
  onBack: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  slug,
  status,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
  onCopyLink,
  linkCopied,
  mobileView,
  onToggleMobileView,
  previewDevice,
  onChangePreviewDevice,
  onToggleFullscreen,
  onBack,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isPublished = status === 'published';

  return (
    <header className="h-14 bg-surface border-b border-border px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* 1. KIRI: Tombol Kembali, Logo, Nama Undangan, Status Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer min-h-[36px]"
          title="Kembali ke Dashboard"
          aria-label="Kembali ke Dashboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <span className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-serif text-sm sm:text-base font-bold text-text-primary truncate max-w-[140px] sm:max-w-[240px] md:max-w-[320px]">
            {title || 'Tanpa Judul'}
          </h1>

          <span
            className={`text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded border shrink-0 ${
              isPublished
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-border bg-surface-elevated text-text-muted'
            }`}
          >
            {isPublished ? 'Dipublikasikan' : 'Draf'}
          </span>
        </div>
      </div>

      {/* 2. TENGAH: Indikator Status Simpan (Bila ruang mencukupi) */}
      <div className="hidden lg:flex items-center">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
            <span>Belum disimpan</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border text-text-subtle text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
            <span>Tersimpan</span>
          </div>
        )}
      </div>

      {/* 3. KANAN: Viewport Switcher, Preview Fullscreen, Simpan, Publikasi, Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Switcher Tampilan Desktop: Layar Lebar / Layar Ponsel */}
        <div className="hidden md:flex items-center bg-surface-elevated border border-border rounded p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onChangePreviewDevice('desktop')}
            className={`py-1 px-2.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              previewDevice === 'desktop'
                ? 'bg-surface text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Pratinjau Layar Lebar"
            aria-label="Tampilan Layar Lebar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="hidden xl:inline text-[11px]">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => onChangePreviewDevice('mobile')}
            className={`py-1 px-2.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              previewDevice === 'mobile'
                ? 'bg-surface text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title="Pratinjau Layar Ponsel"
            aria-label="Tampilan Layar Ponsel"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="hidden xl:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Tombol Pratinjau Layar Penuh */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden md:inline-flex p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors cursor-pointer"
          title="Pratinjau Layar Penuh"
          aria-label="Buka Pratinjau Layar Penuh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Sakelar Mode Mobile (< lg): Formulir / Pratinjau */}
        <button
          type="button"
          onClick={onToggleMobileView}
          className="lg:hidden py-1.5 px-2.5 rounded text-xs font-semibold border border-border bg-surface-elevated text-text-primary hover:bg-surface transition-colors cursor-pointer min-h-[36px]"
          aria-label={mobileView === 'editor' ? 'Beralih ke Pratinjau' : 'Beralih ke Formulir'}
        >
          {mobileView === 'editor' ? 'Lihat Preview' : 'Edit Formulir'}
        </button>

        {/* Tombol Simpan Perubahan Utama */}
        <button
          type="button"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`py-1.5 px-3.5 rounded text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 min-h-[36px] ${
            hasUnsavedChanges && !isSaving
              ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs'
              : 'bg-surface-elevated text-text-subtle border border-border cursor-not-allowed opacity-60'
          }`}
          aria-label="Simpan Perubahan Undangan"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Perubahan</span>
          )}
        </button>

        {/* Tombol Publikasi / Batalkan Publikasi */}
        {!isPublished ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving}
            className="hidden sm:inline-flex py-1.5 px-3.5 rounded text-xs font-semibold border border-primary/20 bg-surface hover:bg-surface-elevated text-primary transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
          >
            Publikasikan
          </button>
        ) : (
          <a
            href={`/i/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex py-1.5 px-3 rounded text-xs font-semibold border border-border bg-surface hover:bg-surface-elevated text-text-primary transition-colors cursor-pointer items-center gap-1 min-h-[36px]"
            title="Buka Halaman Publik"
          >
            <span>Buka Undangan</span>
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Menu Tindakan Lainnya */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Menu Pilihan"
            aria-label="Buka Menu Tindakan Lainnya"
            aria-expanded={menuOpen}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 text-xs"
            >
              {isPublished && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onCopyLink();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-surface-elevated text-text-primary flex items-center justify-between cursor-pointer"
                  >
                    <span>Salin Tautan Publik</span>
                    <span className="text-[10px] text-text-subtle font-mono">{linkCopied ? 'Tersalin!' : ''}</span>
                  </button>
                  <a
                    href={`/i/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="w-full text-left px-3.5 py-2 hover:bg-surface-elevated text-text-primary flex items-center justify-between cursor-pointer sm:hidden"
                  >
                    <span>Buka Undangan</span>
                    <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onUnpublish();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-surface-elevated text-text-muted hover:text-danger cursor-pointer"
                  >
                    Batalkan Publikasi
                  </button>
                  <div className="border-t border-border my-1" />
                </>
              )}

              {!isPublished && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onPublish();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-elevated text-primary font-semibold sm:hidden cursor-pointer"
                >
                  Publikasikan Undangan
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-danger/10 text-danger font-medium cursor-pointer"
              >
                Hapus Undangan
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
