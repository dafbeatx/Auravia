import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const EventSection: React.FC<SectionRendererProps> = ({ events }) => {
  const eventList = events && events.length > 0 ? events : [];

  return (
    <section aria-labelledby="section-event-heading" className="py-16 px-6 max-w-2xl mx-auto space-y-8">
      <h2
        id="section-event-heading"
        className="text-2xl sm:text-3xl font-normal text-center text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Agenda Acara
      </h2>

      {eventList.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
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
                className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[var(--theme-color-border)] pb-3">
                  <h3 className="font-semibold text-base text-[var(--theme-color-primary)]">
                    {evt.title}
                  </h3>
                  {evt.is_primary && (
                    <span className="self-start sm:self-auto text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-bg)] text-[var(--theme-color-primary)]/70">
                      Acara Utama
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-[var(--theme-color-primary)]/80">
                  {dateStr && <p className="font-medium text-sm text-[var(--theme-color-primary)]">{dateStr}</p>}
                  {timeStr && (
                    <p>
                      Waktu: {endTimeStr ? `${timeStr} - ${endTimeStr}` : `${timeStr} s.d. selesai`} {evt.timezone}
                    </p>
                  )}
                  <p className="font-semibold pt-1">{evt.venue_name}</p>
                  {evt.address && <p className="text-[var(--theme-color-primary)]/70">{evt.address}</p>}
                </div>

                {evt.maps_url ? (
                  <div className="pt-2">
                    <a
                      href={evt.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--theme-color-primary)] hover:underline"
                    >
                      Buka Google Maps &rarr;
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
