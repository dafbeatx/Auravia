import React from 'react';

export type DividerVariant = 'diamond' | 'line' | 'minimal' | 'gold' | 'none';

export interface DecorativeDividerProps {
  variant?: DividerVariant;
  className?: string;
  withLine?: boolean;
}

/**
 * Reusable DecorativeDivider Ornament:
 * Elemen pemisah dekoratif antar-judul dan konten seksi undangan.
 * Menggunakan token tema CSS (--theme-color-accent, --theme-color-border)
 * tanpa dependensi aset eksternal.
 */
export const DecorativeDivider: React.FC<DecorativeDividerProps> = ({
  variant = 'diamond',
  className = '',
  withLine = true,
}) => {
  if (variant === 'none') {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div
        className={`w-12 h-px bg-[var(--theme-color-border)]/40 mx-auto select-none ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'line') {
    return (
      <div
        className={`flex items-center justify-center gap-2 select-none py-1 ${className}`}
        aria-hidden="true"
      >
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-[var(--theme-color-border)]/60" />
        <span className="text-[7px] text-[var(--theme-color-accent)] opacity-80">◆</span>
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-[var(--theme-color-border)]/60" />
      </div>
    );
  }

  if (variant === 'gold') {
    return (
      <div className={`space-y-1.5 select-none ${className}`} aria-hidden="true">
        <div className="flex items-center justify-center gap-2 text-[var(--theme-color-accent)] text-xs">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-[var(--theme-color-accent)]/80" />
          <span className="text-[10px] text-[var(--theme-color-accent)]">✦</span>
          <span className="text-[7px] text-[var(--theme-color-accent-soft)]">◆</span>
          <span className="text-[10px] text-[var(--theme-color-accent)]">✦</span>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-[var(--theme-color-accent)]/80" />
        </div>
        {withLine && (
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--theme-color-accent)]/40 to-transparent mx-auto" />
        )}
      </div>
    );
  }

  // Varian 'diamond' (bawaan Classic Elegance)
  return (
    <div className={`space-y-2 select-none ${className}`} aria-hidden="true">
      <div className="flex items-center justify-center gap-1.5 text-[var(--theme-color-accent)] text-xs">
        <span>✦</span>
        <span className="text-[8px] opacity-70">♦</span>
        <span>✦</span>
      </div>
      {withLine && (
        <div className="w-16 h-px bg-[var(--theme-color-border)]/50 mx-auto" />
      )}
    </div>
  );
};
