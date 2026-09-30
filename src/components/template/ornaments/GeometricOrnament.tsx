import React from 'react';

export interface GeometricOrnamentProps {
  className?: string;
  variant?: 'diamond-cluster' | 'islamic-star' | 'minimal-line' | 'square-frame';
  color?: string;
}

/**
 * Reusable GeometricOrnament Component:
 * Ornamen motif geometris presisi untuk template Modern Minimal dan Royal Navy & Gold.
 * Menggunakan token tema CSS (--theme-color-accent, --theme-color-border)
 * untuk konsistensi desain sistem.
 */
export const GeometricOrnament: React.FC<GeometricOrnamentProps> = ({
  className = '',
  variant = 'diamond-cluster',
  color = 'currentColor',
}) => {
  if (variant === 'islamic-star') {
    return (
      <svg
        className={`w-8 h-8 select-none ${className}`}
        viewBox="0 0 32 32"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="7" y="7" width="18" height="18" rx="1" transform="rotate(0 16 16)" opacity="0.6" />
        <rect x="7" y="7" width="18" height="18" rx="1" transform="rotate(45 16 16)" />
        <circle cx="16" cy="16" r="3" fill={color} fillOpacity="0.25" />
      </svg>
    );
  }

  if (variant === 'minimal-line') {
    return (
      <div className={`flex items-center justify-center gap-2 select-none ${className}`} aria-hidden="true">
        <div className="w-8 h-px bg-current opacity-30" />
        <div className="w-2 h-2 rotate-45 border border-current opacity-70" />
        <div className="w-8 h-px bg-current opacity-30" />
      </div>
    );
  }

  if (variant === 'square-frame') {
    return (
      <svg
        className={`w-10 h-10 select-none ${className}`}
        viewBox="0 0 40 40"
        fill="none"
        stroke={color}
        strokeWidth="1"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="28" height="28" strokeDasharray="2 2" opacity="0.4" />
        <rect x="10" y="10" width="20" height="20" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="1.5" fill={color} />
      </svg>
    );
  }

  // Varian bawaan 'diamond-cluster'
  return (
    <div className={`flex items-center justify-center gap-1.5 select-none ${className}`} aria-hidden="true">
      <span className="text-[7px] text-[var(--theme-color-accent-soft)] opacity-60">◆</span>
      <span className="text-[10px] text-[var(--theme-color-accent)] opacity-85">◆</span>
      <span className="text-[13px] text-[var(--theme-color-accent)] font-bold">◆</span>
      <span className="text-[10px] text-[var(--theme-color-accent)] opacity-85">◆</span>
      <span className="text-[7px] text-[var(--theme-color-accent-soft)] opacity-60">◆</span>
    </div>
  );
};
