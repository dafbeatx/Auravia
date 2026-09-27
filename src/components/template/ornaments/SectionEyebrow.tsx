import React from 'react';

export type EyebrowVariant = 'minimal' | 'diamond' | 'gold' | 'royal' | 'none';

export interface SectionEyebrowProps {
  children: React.ReactNode;
  variant?: EyebrowVariant;
  className?: string;
}

/**
 * Reusable SectionEyebrow Ornament:
 * Kapsul atau teks pembuka untuk kategori acara atau tajuk subseksi.
 */
export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({
  children,
  variant = 'diamond',
  className = '',
}) => {
  if (!children || variant === 'none') return null;

  if (variant === 'minimal') {
    return (
      <span
        className={`inline-block text-xs uppercase tracking-widest font-medium text-[var(--theme-color-primary)]/75 ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'royal') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-1 text-xs uppercase tracking-[0.2em] font-medium text-[var(--theme-color-accent-soft)] border border-[var(--theme-color-border)]/60 rounded-full bg-[var(--theme-color-surface)]/85 backdrop-blur-xs ${className}`}
      >
        <span className="text-[8px] text-[var(--theme-color-accent)]">✦</span>
        <span>{children}</span>
        <span className="text-[8px] text-[var(--theme-color-accent)]">✦</span>
      </div>
    );
  }

  if (variant === 'gold') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs uppercase tracking-widest font-semibold rounded-full border border-[var(--theme-color-accent)]/50 bg-[var(--theme-color-surface)] text-[var(--theme-color-accent)] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`inline-block px-3.5 py-1 text-xs uppercase tracking-widest font-semibold rounded-[var(--theme-radius-button)] border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)]/80 ${className}`}
    >
      {children}
    </div>
  );
};
