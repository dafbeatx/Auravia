import React from 'react';
import type { SectionRendererProps } from '../types';

export const RsvpSection: React.FC<SectionRendererProps> = ({ invitation }) => {
  if (invitation.allowRsvp === false) {
    return null;
  }

  return (
    <section aria-labelledby="section-rsvp-heading" className="py-16 px-6 max-w-2xl mx-auto text-center space-y-4">
      <h2
        id="section-rsvp-heading"
        className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Konfirmasi Kehadiran
      </h2>
      <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70 leading-relaxed max-w-md mx-auto">
        Formulir konfirmasi kehadiran tamu (RSVP) sedang disiapkan dan akan segera aktif.
      </div>
    </section>
  );
};
