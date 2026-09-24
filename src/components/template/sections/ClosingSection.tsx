import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const ClosingSection: React.FC<SectionRendererProps> = ({ content }) => {
  const note = typeof content?.closing_notes === 'string' ? content.closing_notes.trim() : '';

  return (
    <footer className="py-20 px-6 max-w-xl mx-auto space-y-6 text-center border-t border-[var(--theme-color-border)] mt-12">
      <p
        className="font-normal text-2xl sm:text-3xl text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Terima Kasih
      </p>

      {note ? (
        <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed italic max-w-md mx-auto">
          &ldquo;{note}&rdquo;
        </p>
      ) : null}

      <div className="pt-8 text-[11px] text-[var(--theme-color-primary)]/40 tracking-wider">
        AUROVIA &bull; ELEGANT DIGITAL INVITATION
      </div>
    </footer>
  );
};
