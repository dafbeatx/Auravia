import React from 'react';
import type { SectionRendererProps, InvitationContentQuote } from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';
import { DEFAULT_ISLAMIC_QUOTE } from '@/lib/template/defaults';

export const QuoteSection: React.FC<SectionRendererProps> = ({ content }) => {
  const quoteData = (content?.quote || {}) as InvitationContentQuote;

  // Jika quote secara eksplisit dinonaktifkan di konfigurasi konten
  if (quoteData.enabled === false) {
    return null;
  }

  const arabicText = quoteData.arabic?.trim() || DEFAULT_ISLAMIC_QUOTE.arabic;
  const translationText = quoteData.translation?.trim() || DEFAULT_ISLAMIC_QUOTE.translation;
  const sourceText = quoteData.source?.trim() || DEFAULT_ISLAMIC_QUOTE.source;

  return (
    <section
      id="quote"
      className="py-16 sm:py-24 px-6 text-center max-w-3xl mx-auto space-y-6"
    >
      <DecorativeDivider variant="diamond" withLine={false} />

      <div className="p-6 sm:p-10 rounded-[var(--theme-radius-card)] border border-[var(--theme-color-border)]/35 bg-[var(--theme-color-surface)]/75 backdrop-blur-xs space-y-6 shadow-xs">
        {/* Teks Ayat / Kaligrafi Arab */}
        {arabicText ? (
          <p
            dir="rtl"
            lang="ar"
            className="text-lg sm:text-2xl font-serif leading-loose tracking-wide text-[var(--theme-color-primary)] font-normal px-2 select-text"
          >
            {arabicText}
          </p>
        ) : null}

        {/* Garis Pemisah Emas Halus */}
        <DecorativeDivider variant="diamond" withLine={true} className="my-3" />

        {/* Teks Terjemahan / Pesan Kutipan */}
        {translationText ? (
          <p
            className="text-xs sm:text-sm italic leading-relaxed text-[var(--theme-color-primary)]/85 max-w-xl mx-auto"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            &ldquo;{translationText}&rdquo;
          </p>
        ) : null}

        {/* Sumber Ayat / Referensi */}
        {sourceText ? (
          <div className="pt-2">
            <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[var(--theme-color-accent)] px-3 py-1 rounded-[var(--theme-radius-button)] border border-[var(--theme-color-border)]/30 bg-[var(--theme-color-bg)]/60">
              {sourceText}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
};
