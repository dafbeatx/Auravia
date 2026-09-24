import React from 'react';
import type { SectionRendererProps } from '../types';

export const HeroSection: React.FC<SectionRendererProps> = ({
  invitation,
  events,
}) => {
  // Cari event utama (is_primary = true) atau event pertama sebagai penanggalan hero
  const primaryEvent = events?.find((e) => e.is_primary) ?? events?.[0];
  const eventDate = primaryEvent ? new Date(primaryEvent.start_time) : null;
  const isDateValid = eventDate && !isNaN(eventDate.getTime());

  const formattedDate = isDateValid
    ? eventDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <header className="py-20 sm:py-28 px-6 text-center max-w-3xl mx-auto space-y-6">
      <div className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-semibold rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)]/80">
        {invitation.eventType}
      </div>

      <h1
        className="text-4xl sm:text-5xl md:text-6xl font-normal leading-tight text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        {invitation.title}
      </h1>

      {formattedDate ? (
        <div className="pt-2 text-sm sm:text-base font-medium text-[var(--theme-color-primary)]/80">
          <p>{formattedDate}</p>
          {primaryEvent?.venue_name ? (
            <p className="text-xs text-[var(--theme-color-primary)]/60 mt-1">
              {primaryEvent.venue_name}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};
