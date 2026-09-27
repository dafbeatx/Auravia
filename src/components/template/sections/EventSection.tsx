import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';

export const EventSection: React.FC<SectionRendererProps> = ({ events }) => {
  const eventList = events && events.length > 0 ? events : [];

  return (
    <section id="event" aria-labelledby="section-event-heading" className="py-16 sm:py-24 px-6 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2
          id="section-event-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Agenda Acara
        </h2>
        <DecorativeDivider variant="diamond" />
      </div>

      {eventList.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded-[var(--theme-radius-card)] bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Belum ada rangkaian acara.
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
                className="p-6 sm:p-8 border border-[var(--theme-color-border)] rounded-[var(--theme-radius-card)] bg-[var(--theme-color-surface)] space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[var(--theme-color-border)]/50 pb-3">
                  <h3
                    className="font-semibold text-lg text-[var(--theme-color-primary)]"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    {evt.title}
                  </h3>
                  {evt.is_primary && (
                    <span className="self-start sm:self-auto text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-[var(--theme-radius-button)] border border-[var(--theme-color-border)] bg-[var(--theme-color-bg)] text-[var(--theme-color-accent)]">
                      Acara Utama
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5 text-[var(--theme-color-primary)]/80 leading-relaxed">
                  {dateStr && (
                    <p className="font-semibold text-sm text-[var(--theme-color-accent)]">
                      {dateStr}
                    </p>
                  )}
                  {timeStr && (
                    <p className="text-[var(--theme-color-primary)]/90">
                      Waktu: {endTimeStr ? `${timeStr} - ${endTimeStr}` : `${timeStr} s.d. selesai`} {evt.timezone}
                    </p>
                  )}
                  <p className="font-semibold pt-1 text-[var(--theme-color-primary)] text-sm">
                    {evt.venue_name}
                  </p>
                  {evt.address && (
                    <p className="text-[var(--theme-color-primary)]/70">
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
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-[var(--theme-radius-button)] text-xs font-semibold border border-[var(--theme-color-border)] bg-[var(--theme-color-bg)] hover:bg-[var(--theme-color-accent)] text-[var(--theme-color-primary)] hover:text-[var(--theme-color-bg)] transition-all cursor-pointer min-h-[44px] shadow-2xs"
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

export const EventsSection = EventSection;
