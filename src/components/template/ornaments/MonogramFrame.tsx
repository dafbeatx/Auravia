import React from 'react';

export type MonogramFrameVariant = 'classic-ring' | 'none';

export interface MonogramFrameProps {
  initials?: string;
  photoUrl?: string | null;
  alt?: string;
  variant?: MonogramFrameVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable MonogramFrame Ornament:
 * Bingkai foto atau inisial monogram mempelai.
 * Jika photoUrl tersedia, merender foto berbingkai dengan aman.
 * Jika photoUrl tidak ada, merender inisial monogram tipografis.
 */
export const MonogramFrame: React.FC<MonogramFrameProps> = ({
  initials = '?',
  photoUrl,
  alt = 'Foto mempelai',
  variant = 'classic-ring',
  className = '',
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-20 h-20 text-2xl'
      : size === 'lg'
      ? 'w-36 h-36 sm:w-40 sm:h-40 text-4xl sm:text-5xl'
      : 'w-28 h-28 sm:w-32 sm:h-32 text-3xl sm:text-4xl';

  if (photoUrl) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src={photoUrl}
          alt={alt}
          loading="lazy"
          className={`${sizeClasses} rounded-full object-cover border-2 border-[var(--theme-color-border)] shadow-sm transition-transform duration-300 group-hover:scale-105`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border-2 border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] shadow-xs transition-transform duration-300 group-hover:scale-105 select-none ${sizeClasses} ${className}`}
      aria-label={alt}
    >
      {/* Cincin Dashed Inner jika varian classic-ring aktif */}
      {variant === 'classic-ring' && (
        <div
          className="absolute inset-1.5 rounded-full border border-dashed border-[var(--theme-color-border)]/40 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <span
        className="font-normal text-[var(--theme-color-accent)] pt-0.5"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        {initials}
      </span>
    </div>
  );
};
