import React, { useState, useEffect } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const HeroSection: React.FC<SectionRendererProps> = ({
  invitation,
  content,
  events,
  guest,
}) => {
  // Ambil data event utama atau event pertama untuk penanggalan riil
  const primaryEvent = events?.find((e) => e.is_primary) ?? events?.[0];
  const eventDate = primaryEvent ? new Date(primaryEvent.start_time) : null;
  const isDateValid = Boolean(eventDate && !isNaN(eventDate.getTime()));

  const formattedDate = isDateValid && eventDate
    ? eventDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Hitung countdown nyata berdasarkan start_time acara utama tanpa fake data
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const primaryStartTime = primaryEvent?.start_time;

  useEffect(() => {
    if (!primaryStartTime) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(primaryStartTime);
    if (isNaN(targetDate.getTime())) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [primaryStartTime]);

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
    <header id="hero" className="py-20 sm:py-28 px-6 text-center max-w-3xl mx-auto space-y-6">
      <div className="space-y-3">
        <div className="inline-block px-3.5 py-1 text-xs uppercase tracking-widest font-semibold rounded-[var(--theme-radius-button)] border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)]/80">
          {invitation.eventType}
        </div>

        {/* Ornamen Klasik Diamond */}
        <div className="flex items-center justify-center gap-1.5 text-[var(--theme-color-accent)] text-xs select-none">
          <span>✦</span>
          <span className="text-[8px] opacity-70">♦</span>
          <span>✦</span>
        </div>
      </div>

      {openingText ? (
        <p
          className="text-sm sm:text-base italic text-[var(--theme-color-primary)]/75 tracking-wide max-w-xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          {openingText}
        </p>
      ) : null}

      {guest?.name ? (
        <div className="inline-flex flex-col items-center gap-1 py-2.5 px-6 rounded-[var(--theme-radius-card)] border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/90 backdrop-blur-sm text-center shadow-xs">
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

        <div className="w-16 h-px bg-[var(--theme-color-border)]/50 mx-auto pt-1" />
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

      {/* Hitung Mundur Acara Riil (Hanya jika start_time di masa depan) */}
      {timeLeft ? (
        <div className="pt-4 max-w-sm mx-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            {[
              { label: 'Hari', value: timeLeft.days },
              { label: 'Jam', value: timeLeft.hours },
              { label: 'Menit', value: timeLeft.minutes },
              { label: 'Detik', value: timeLeft.seconds },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 sm:p-3 rounded-[var(--theme-radius-card)] border border-[var(--theme-color-border)]/40 bg-[var(--theme-color-surface)]/80 shadow-xs"
              >
                <span
                  className="block text-xl sm:text-2xl font-bold text-[var(--theme-color-accent)]"
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                >
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-[var(--theme-color-primary)]/75 uppercase tracking-widest mt-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
};
