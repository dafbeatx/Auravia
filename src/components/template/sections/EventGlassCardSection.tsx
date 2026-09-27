import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';

export const EventGlassCardSection: React.FC<SectionRendererProps> = ({ events }) => {
  const eventList = events && events.length > 0 ? events : [];

  return (
    <section
      id="event"
      aria-labelledby="section-event-royal-heading"
      className="py-16 sm:py-24 px-6 max-w-2xl mx-auto space-y-8 relative z-10"
    >
      <div className="text-center space-y-2">
        <h2
          id="section-event-royal-heading"
          className="text-2xl sm:text-4xl font-normal text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          Agenda Acara
        </h2>
        <DecorativeDivider variant="royal" />
      </div>

      {eventList.length === 0 ? (
        <div className="p-6 border border-[var(--template-border,#D4AF37)]/30 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/50 backdrop-blur-sm text-center text-xs text-[var(--template-text,#FFFFFF)]/70">
          Belum ada rangkaian acara yang dijadwalkan.
        </div>
      ) : (
        <div className="space-y-6">
          {eventList.map((evt) => {
            const startDate = new Date(evt.start_time);
            const isDateValid = !isNaN(startDate.getTime());
            const dateStr = isDateValid
              ? startDate.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null;
            const timeStr = isDateValid
              ? startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : null;

            const endDate = evt.end_time ? new Date(evt.end_time) : null;
            const isEndDateValid = endDate && !isNaN(endDate.getTime());
            const endTimeStr = isEndDateValid
              ? endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div
                key={evt.id}
                className="p-6 sm:p-8 border border-[var(--template-border,#D4AF37)]/35 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md space-y-5 shadow-md hover:border-[var(--template-accent,#D4AF37)]/80 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--template-border,#D4AF37)]/30 pb-3">
                  <h3
                    className="font-normal text-xl sm:text-2xl text-[var(--template-accent,#D4AF37)]"
                    style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
                  >
                    {evt.title}
                  </h3>
                  {evt.is_primary && (
                    <span className="self-start sm:self-auto text-[10px] tracking-widest uppercase font-semibold px-3 py-1 rounded-full border border-[var(--template-accent,#D4AF37)]/60 bg-[var(--template-accent,#D4AF37)]/10 text-[var(--template-accent,#D4AF37)]">
                      Acara Utama
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-2 text-[var(--template-text,#FFFFFF)]/85 leading-relaxed">
                  {dateStr && (
                    <p className="font-semibold text-sm sm:text-base text-[var(--template-accent,#D4AF37)]">
                      {dateStr}
                    </p>
                  )}
                  {timeStr && (
                    <p className="text-[var(--template-text,#FFFFFF)]">
                      Waktu: {endTimeStr ? `${timeStr} - ${endTimeStr}` : `${timeStr} s.d. selesai`} {evt.timezone}
                    </p>
                  )}
                  <p className="font-semibold pt-1 text-sm text-[var(--template-text,#FFFFFF)]">
                    {evt.venue_name}
                  </p>
                  {evt.address && (
                    <p className="text-[var(--template-text,#FFFFFF)]/75">
                      {evt.address}
                    </p>
                  )}
                </div>

                {evt.maps_url ? (
                  <div className="pt-2">
                    <a
                      href={evt.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-[var(--template-accent,#D4AF37)] text-[var(--template-accent,#D4AF37)] hover:bg-[var(--template-accent,#D4AF37)] hover:text-[#0A1324] transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Buka Google Maps</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
