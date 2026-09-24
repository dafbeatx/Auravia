import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const WishesSection: React.FC<SectionRendererProps> = ({ invitation }) => {
  if (invitation.showWishes === false) {
    return null;
  }

  return (
    <section aria-labelledby="section-wishes-heading" className="py-16 px-6 max-w-xl mx-auto space-y-6 text-center">
      <h2
        id="section-wishes-heading"
        className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Doa &amp; Ucapan
      </h2>

      <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
        Kirimkan doa dan pesan hangat untuk kami mengawali lembaran perjalanan baru.
      </p>

      <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70">
        Buku ucapan dan doa tamu undangan akan segera aktif.
      </div>
    </section>
  );
};
