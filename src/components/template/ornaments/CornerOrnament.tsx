import React from 'react';

export interface CornerOrnamentProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'royal' | 'floral' | 'geometric' | 'minimal';
  className?: string;
  size?: number;
}

/**
 * Reusable CornerOrnament Component:
 * Hiasan sudut ornamental untuk bingkai card, foto mempelai, dan frame seksi undangan.
 * Mendukung variasi royal emas, floral botanical, dan geometris modern.
 */
export const CornerOrnament: React.FC<CornerOrnamentProps> = ({
  position = 'top-left',
  variant = 'royal',
  className = '',
  size = 28,
}) => {
  const rotationClasses = {
    'top-left': '',
    'top-right': 'rotate-90',
    'bottom-right': 'rotate-180',
    'bottom-left': '-rotate-90',
  }[position];

  if (variant === 'minimal') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={`select-none ${rotationClasses} ${className}`}
        aria-hidden="true"
      >
        <path d="M4 16V4h12" opacity="0.6" />
        <circle cx="4" cy="4" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (variant === 'floral') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className={`select-none ${rotationClasses} ${className}`}
        aria-hidden="true"
      >
        <path d="M4 28V10C4 6.69 6.69 4 10 4h18" opacity="0.4" />
        <path d="M4 14c2-1 5-3 6-6" />
        <path d="M14 4c-1 2-3 5-6 6" />
        <circle cx="10" cy="10" r="2" fill="currentColor" fillOpacity="0.25" />
      </svg>
    );
  }

  if (variant === 'geometric') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className={`select-none ${rotationClasses} ${className}`}
        aria-hidden="true"
      >
        <path d="M4 24V4h20" strokeWidth="1.5" />
        <rect x="7" y="7" width="5" height="5" fill="currentColor" fillOpacity="0.3" />
        <path d="M4 12h8v-8" opacity="0.5" />
      </svg>
    );
  }

  // Varian bawaan 'royal'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className={`select-none text-[var(--theme-color-accent)] ${rotationClasses} ${className}`}
      aria-hidden="true"
    >
      <path d="M3 28V8C3 5.24 5.24 3 8 3h20" opacity="0.5" />
      <path d="M7 24V10C7 8.34 8.34 7 10 7h14" strokeWidth="1" opacity="0.75" />
      <circle cx="9" cy="9" r="2" fill="currentColor" />
      <path d="M13 3l-3 3 3 3" opacity="0.8" />
    </svg>
  );
};
