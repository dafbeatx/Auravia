import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';

export const ClosingRoyalSection: React.FC<SectionRendererProps> = ({ content, invitation }) => {
  const note = typeof content?.closing_notes === 'string' ? content.closing_notes.trim() : '';

  const hostNames = Array.isArray(content?.hosts)
    ? content.hosts
        .map((h) => h?.name?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0))
    : [];

  const coupleNames =
    content?.hero?.couple_names?.trim() ||
    (hostNames.length >= 2 ? `${hostNames[0]} & ${hostNames[1]}` : invitation.title);

  return (
    <footer
      id="closing"
      aria-label="Seksi Penutup Undangan"
      className="py-20 sm:py-28 px-6 max-w-xl mx-auto space-y-8 text-center border-t border-[var(--template-border,#D4AF37)]/30 mt-16 relative z-10"
    >
      <div className="space-y-3">
        <p
          className="font-normal text-3xl sm:text-4xl text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          Terima Kasih
        </p>
        <DecorativeDivider variant="royal" />
      </div>

      {note ? (
        <p className="text-xs sm:text-sm text-[var(--template-text,#FFFFFF)]/85 leading-relaxed italic max-w-md mx-auto">
          &ldquo;{note}&rdquo;
        </p>
      ) : null}

      <div className="space-y-2 pt-2">
        <p className="text-[11px] uppercase tracking-widest text-[var(--template-text,#FFFFFF)]/70">
          Kami yang berbahagia,
        </p>
        <p
          className="font-normal text-2xl sm:text-3xl text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          {coupleNames}
        </p>
      </div>

      <div className="pt-8 text-[11px] text-[var(--template-accent,#D4AF37)]/60 tracking-widest font-mono">
        AUROVIA &bull; ROYAL WEDDING INVITATION
      </div>
    </footer>
  );
};
