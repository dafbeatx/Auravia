import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const RsvpSection: React.FC<SectionRendererProps> = ({ invitation }) => {
  if (invitation.allowRsvp === false) {
    return null;
  }

  return (
    <section aria-labelledby="section-rsvp-heading" className="py-16 px-6 max-w-xl mx-auto space-y-6 text-center">
      <h2
        id="section-rsvp-heading"
        className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Konfirmasi Kehadiran
      </h2>

      <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
        Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami.
      </p>

      <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70">
        Formulir konfirmasi kehadiran (RSVP) akan segera dibuka secara interaktif.
      </div>
    </section>
  );
};
