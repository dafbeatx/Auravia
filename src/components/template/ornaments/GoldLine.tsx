import React from 'react';

export interface GoldLineProps {
  className?: string;
  variant?: 'single' | 'double' | 'gradient' | 'with-diamond';
  width?: 'full' | 'half' | 'short';
}

/**
 * Reusable GoldLine Component:
 * Garis aksen emas mewah untuk template Royal Navy & Gold dan Classic Elegance.
 * Menggunakan variabel tema CSS (--theme-color-accent, --theme-color-accent-soft).
 */
export const GoldLine: React.FC<GoldLineProps> = ({
  className = '',
  variant = 'gradient',
  width = 'half',
}) => {
  const widthClasses = {
    full: 'w-full',
    half: 'w-32 sm:w-48',
    short: 'w-16 sm:w-24',
  }[width];

  if (variant === 'single') {
    return (
      <div
        className={`h-px bg-[var(--theme-color-accent)]/80 mx-auto select-none ${widthClasses} ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'double') {
    return (
      <div className={`space-y-1 mx-auto select-none ${widthClasses} ${className}`} aria-hidden="true">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--theme-color-accent)] to-transparent" />
        <div className="w-3/4 mx-auto h-[0.5px] bg-gradient-to-r from-transparent via-[var(--theme-color-accent-soft)]/60 to-transparent" />
      </div>
    );
  }

  if (variant === 'with-diamond') {
    return (
      <div className={`flex items-center justify-center gap-2 select-none mx-auto ${widthClasses} ${className}`} aria-hidden="true">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--theme-color-accent)]" />
        <span className="text-[9px] text-[var(--theme-color-accent)]">❖</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--theme-color-accent)]" />
      </div>
    );
  }

  // Varian bawaan 'gradient'
  return (
    <div
      className={`h-px bg-gradient-to-r from-transparent via-[var(--theme-color-accent)] to-transparent mx-auto select-none ${widthClasses} ${className}`}
      aria-hidden="true"
    />
  );
};
