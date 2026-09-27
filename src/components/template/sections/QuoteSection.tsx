import React from 'react';
import type { SectionRendererProps, InvitationContentQuote } from '@/lib/template/types';

// Fallback autentik ayat suci pernikahan bernuansa Islami (QS. Ar-Rum: 21)
const DEFAULT_ISLAMIC_QUOTE: Required<InvitationContentQuote> = {
  enabled: true,
  arabic:
    'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ',
  translation:
    'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berpikir.',
  source: 'QS. Ar-Rum: 21',
};

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
      {/* Ornamen Klasik Simbol Kasih */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-[var(--theme-color-accent)] text-xs select-none">
          <span>✦</span>
          <span className="text-[8px] opacity-70">♦</span>
          <span>✦</span>
        </div>
      </div>

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
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-color-border)]/40 to-transparent w-16" />
          <span className="text-[var(--theme-color-accent)] text-[8px] opacity-70">♦</span>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-color-border)]/40 to-transparent w-16" />
        </div>

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
