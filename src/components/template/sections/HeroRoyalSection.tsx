import React, { useState, useEffect } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { SectionEyebrow, DecorativeDivider } from '@/components/template/ornaments';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const HeroRoyalSection: React.FC<SectionRendererProps> = ({
  invitation,
  content,
  events,
  guest,
}) => {
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

  const hostNames = Array.isArray(content?.hosts)
    ? content.hosts
        .map((h) => h?.name?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0))
    : [];

  const derivedCoupleNames =
    content?.hero?.couple_names?.trim() ||
    (hostNames.length >= 2 ? `${hostNames[0]} & ${hostNames[1]}` : null);

  const displayHeadline = content?.hero?.headline?.trim() || "Walimatul 'Ursy";
  const openingText =
    content?.hero?.opening_text?.trim() ||
    'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu tercurah mengiringi pernikahan kami.';
  const displayLocation =
    content?.hero?.location_short?.trim() || primaryEvent?.venue_name || null;

  const guestGreeting =
    content?.hero?.guest_greeting?.trim() ||
    content?.hero?.guestGreeting?.trim() ||
    'Kepada Yth. Bapak/Ibu/Saudara/i:';

  return (
    <header
      id="hero"
      aria-label="Seksi Pembuka Undangan Kerajaan"
      className="py-20 sm:py-28 px-6 text-center max-w-3xl mx-auto space-y-8 relative z-10"
    >
      <div className="space-y-3">
        <SectionEyebrow variant="royal">
          {content?.hero?.eyebrow?.trim() || invitation.eventType || 'Pernikahan'}
        </SectionEyebrow>
        <DecorativeDivider variant="royal" withLine={true} />
      </div>

      <div className="space-y-4">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.15] tracking-wide text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          {displayHeadline}
        </h1>

        {derivedCoupleNames && (
          <p
            className="text-2xl sm:text-4xl font-light text-[var(--template-text,#FFFFFF)] tracking-wide pt-2"
            style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
          >
            {derivedCoupleNames}
          </p>
        )}
      </div>

      {openingText ? (
        <p className="text-xs sm:text-sm text-[var(--template-text,#FFFFFF)]/80 italic leading-relaxed max-w-xl mx-auto px-4">
          &ldquo;{openingText}&rdquo;
        </p>
      ) : null}

      {guest?.name ? (
        <div className="inline-flex flex-col items-center gap-1.5 py-3 px-6 rounded-2xl border border-[var(--template-border,#D4AF37)]/40 bg-[var(--template-surface,#1E3A5F)]/70 backdrop-blur-md text-center shadow-md">
          <span className="text-[10px] uppercase tracking-widest text-[var(--template-accent,#D4AF37)] font-semibold">
            {guestGreeting}
          </span>
          <span
            className="text-base sm:text-xl font-medium text-[var(--template-text,#FFFFFF)]"
            style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
          >
            {guest.name}
          </span>
        </div>
      ) : null}

      {formattedDate || displayLocation ? (
        <div className="pt-2 text-xs sm:text-sm font-medium text-[var(--template-accent,#D4AF37)]/90 space-y-1">
          {formattedDate ? <p className="tracking-wider">{formattedDate}</p> : null}
          {displayLocation ? (
            <p className="text-xs text-[var(--template-text,#FFFFFF)]/70 font-normal">
              {displayLocation}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Hitung Mundur Acara (Glass Navy Cards with Gold Accent) */}
      {timeLeft ? (
        <div className="pt-4 max-w-md mx-auto">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
            {[
              { label: 'Hari', value: timeLeft.days },
              { label: 'Jam', value: timeLeft.hours },
              { label: 'Menit', value: timeLeft.minutes },
              { label: 'Detik', value: timeLeft.seconds },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-4 rounded-xl border border-[var(--template-border,#D4AF37)]/35 bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md shadow-sm"
              >
                <span
                  className="block text-2xl sm:text-3xl font-bold text-[var(--template-accent,#D4AF37)]"
                  style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
                >
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-[var(--template-text,#FFFFFF)]/75 uppercase tracking-wider mt-1 font-sans">
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
