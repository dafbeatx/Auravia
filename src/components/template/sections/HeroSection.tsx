import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const HeroSection: React.FC<SectionRendererProps> = ({
  invitation,
  content,
  events,
  guest,
}) => {
  // Ambil data event utama atau event pertama untuk penanggalan riil
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

  // Nama pasangan yang dikonfigurasi di hero atau diturunkan dari data hosts
  const hostNames = Array.isArray(content?.hosts)
    ? content.hosts
        .map((h) => h?.name?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0))
    : [];

  const derivedCoupleNames =
    content?.hero?.couple_names?.trim() ||
    (hostNames.length >= 2 ? `${hostNames[0]} & ${hostNames[1]}` : null);

  const displayHeadline = content?.hero?.headline?.trim() || invitation.title;
  const openingText = content?.hero?.opening_text?.trim();
  const displayLocation =
    content?.hero?.location_short?.trim() || primaryEvent?.venue_name || null;

  const guestGreeting =
    content?.hero?.guest_greeting?.trim() ||
    content?.hero?.guestGreeting?.trim() ||
    'Kepada Yth.';

  return (
    <header className="py-20 sm:py-28 px-6 text-center max-w-3xl mx-auto space-y-6">
      <div className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-semibold rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)]/80">
        {invitation.eventType}
      </div>

      {openingText ? (
        <p
          className="text-sm sm:text-base italic text-[var(--theme-color-primary)]/75 tracking-wide"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          {openingText}
        </p>
      ) : null}

      {guest?.name ? (
        <div className="inline-flex flex-col items-center gap-1 py-2.5 px-6 rounded-lg border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/90 backdrop-blur-sm text-center shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-[var(--theme-color-primary)]/70 font-semibold">
            {guestGreeting}
          </span>
          <span
            className="text-base sm:text-lg font-medium text-[var(--theme-color-primary)]"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {guest.name}
          </span>
        </div>
      ) : null}

      <div className="space-y-3">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-normal leading-tight text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          {displayHeadline}
        </h1>

        {derivedCoupleNames && derivedCoupleNames !== displayHeadline ? (
          <p
            className="text-2xl sm:text-3xl font-light text-[var(--theme-color-primary)]/90 tracking-wide"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {derivedCoupleNames}
          </p>
        ) : null}
      </div>

      {formattedDate || displayLocation ? (
        <div className="pt-2 text-sm sm:text-base font-medium text-[var(--theme-color-primary)]/80 space-y-1">
          {formattedDate ? <p>{formattedDate}</p> : null}
          {displayLocation ? (
            <p className="text-xs text-[var(--theme-color-primary)]/65">
              {displayLocation}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};
