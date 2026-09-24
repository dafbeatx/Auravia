import React from 'react';
import type { SectionRendererProps } from '../types';

export const WishesSection: React.FC<SectionRendererProps> = ({ invitation }) => {
  if (invitation.showWishes === false) {
    return null;
  }

  return (
    <section aria-labelledby="section-wishes-heading" className="py-16 px-6 max-w-2xl mx-auto text-center space-y-4">
      <h2
        id="section-wishes-heading"
        className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Doa &amp; Ucapan
      </h2>
      <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70 leading-relaxed max-w-md mx-auto">
        Buku ucapan dan doa restu para tamu akan ditampilkan di sini.
      </div>
    </section>
  );
};
