import React from 'react';

export interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable SectionEyebrow Ornament:
 * Kapsul teks pembuka untuk kategori acara atau tajuk subseksi.
 */
export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({
  children,
  className = '',
}) => {
  if (!children) return null;

  return (
    <div
      className={`inline-block px-3.5 py-1 text-xs uppercase tracking-widest font-semibold rounded-[var(--theme-radius-button)] border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)]/80 ${className}`}
    >
      {children}
    </div>
  );
};
