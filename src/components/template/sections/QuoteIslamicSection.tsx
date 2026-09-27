import React from 'react';
import type { SectionRendererProps, InvitationContentQuote } from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';
import { DEFAULT_ISLAMIC_QUOTE } from '@/lib/template/defaults';

export const QuoteIslamicSection: React.FC<SectionRendererProps> = ({ content }) => {
  const quoteData = (content?.quote || {}) as InvitationContentQuote;

  if (quoteData.enabled === false) {
    return null;
  }

  const arabicText = quoteData.arabic?.trim() || DEFAULT_ISLAMIC_QUOTE.arabic;
  const translationText = quoteData.translation?.trim() || DEFAULT_ISLAMIC_QUOTE.translation;
  const sourceText = quoteData.source?.trim() || DEFAULT_ISLAMIC_QUOTE.source;

  return (
    <section
      id="quote"
      aria-label="Untaian Doa dan Kutipan Suci"
      className="py-16 sm:py-24 px-6 text-center max-w-3xl mx-auto space-y-6 relative z-10"
    >
      <DecorativeDivider variant="royal" withLine={false} />

      <div className="p-6 sm:p-12 rounded-2xl border border-[var(--template-border,#D4AF37)]/40 bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md space-y-6 shadow-md">
        {arabicText ? (
          <p
            dir="rtl"
            lang="ar"
            className="text-xl sm:text-3xl font-serif leading-loose tracking-wider text-[var(--template-accent,#D4AF37)] font-normal px-2 select-text"
          >
            {arabicText}
          </p>
        ) : null}

        <DecorativeDivider variant="gold" withLine={true} className="my-2" />

        {translationText ? (
          <p
            className="text-xs sm:text-base italic leading-relaxed text-[var(--template-text,#FFFFFF)]/90 max-w-xl mx-auto px-2"
            style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
          >
            &ldquo;{translationText}&rdquo;
          </p>
        ) : null}

        {sourceText ? (
          <div className="pt-2">
            <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[var(--template-accent,#D4AF37)] px-4 py-1.5 rounded-full border border-[var(--template-border,#D4AF37)]/40 bg-[var(--template-surface,#1E3A5F)]/80">
              {sourceText}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
};
