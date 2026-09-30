import React from 'react';

export interface FloralOrnamentProps {
  className?: string;
  variant?: 'branch' | 'single-leaf' | 'wreath' | 'corner';
  color?: string;
}

/**
 * Reusable FloralOrnament Component:
 * Ornamen motif floral/botanikal vektor untuk template seperti Botanical Garden & Classic Elegance.
 * Menggunakan CSS variable theme (--theme-color-accent) sebagai pewarnaan dinamis.
 */
export const FloralOrnament: React.FC<FloralOrnamentProps> = ({
  className = '',
  variant = 'branch',
  color = 'currentColor',
}) => {
  if (variant === 'single-leaf') {
    return (
      <svg
        className={`w-6 h-6 select-none ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4L12 22l5.4-1.6C20.2 18.6 22 15.5 22 12c0-5.5-4.5-10-10-10z" />
        <path d="M12 2v20" />
        <path d="M7 8l5 4 5-4" />
        <path d="M6 14l6 4 6-4" />
      </svg>
    );
  }

  if (variant === 'wreath') {
    return (
      <svg
        className={`w-12 h-12 select-none ${className}`}
        viewBox="0 0 48 48"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 24C10 16.268 16.268 10 24 10c7.732 0 14 6.268 14 14 0 7.732-6.268 14-14 14-7.732 0-14-6.268-14-14z" strokeDasharray="3 3" opacity="0.4" />
        <path d="M14 18c-2 2-3 5-3 8 0 4 2 7 5 9" />
        <path d="M11 22c-1.5-1-2.5-3-2.5-5" />
        <path d="M13 28c-2 0-3.5 1-4.5 2.5" />
        <path d="M34 18c2 2 3 5 3 8 0 4-2 7-5 9" />
        <path d="M37 22c1.5-1 2.5-3 2.5-5" />
        <path d="M35 28c2 0 3.5 1 4.5 2.5" />
      </svg>
    );
  }

  if (variant === 'corner') {
    return (
      <svg
        className={`w-10 h-10 select-none ${className}`}
        viewBox="0 0 40 40"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 36V12C4 7.58 7.58 4 12 4h24" opacity="0.3" />
        <path d="M4 18c3-1 6-4 7-8" />
        <path d="M18 4c-1 3-4 6-8 7" />
        <circle cx="12" cy="12" r="2.5" fill={color} fillOpacity="0.2" />
        <circle cx="6" cy="6" r="1.5" fill={color} />
      </svg>
    );
  }

  // Varian 'branch' bawaan
  return (
    <div className={`flex items-center justify-center gap-3 select-none py-1 ${className}`} aria-hidden="true">
      <svg className="w-8 h-4 rotate-180 opacity-75" viewBox="0 0 32 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
        <path d="M30 8H2" />
        <path d="M10 8c1-3 4-5 7-5" />
        <path d="M18 8c1-3 4-5 7-5" />
        <path d="M14 8c1 3 4 5 7 5" />
      </svg>
      <span className="text-[10px] text-[var(--theme-color-accent)] opacity-90">❧</span>
      <svg className="w-8 h-4 opacity-75" viewBox="0 0 32 16" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
        <path d="M2 8h28" />
        <path d="M10 8c1-3 4-5 7-5" />
        <path d="M18 8c1-3 4-5 7-5" />
        <path d="M14 8c1 3 4 5 7 5" />
      </svg>
    </div>
  );
};
