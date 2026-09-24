import React from 'react';
import type { SectionRendererProps } from '../types';

export const ClosingSection: React.FC<SectionRendererProps> = ({ content }) => {
  const closingNotes =
    typeof content?.closing_notes === 'string' && content.closing_notes.trim()
      ? content.closing_notes.trim()
      : 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.';

  return (
    <footer
      aria-labelledby="section-closing-heading"
      className="py-16 px-6 max-w-2xl mx-auto text-center border-t border-[var(--theme-color-border)]"
    >
      <h2 id="section-closing-heading" className="sr-only">
        Penutup Undangan
      </h2>
      <p className="text-sm text-[var(--theme-color-primary)]/80 leading-relaxed max-w-lg mx-auto">
        {closingNotes}
      </p>
    </footer>
  );
};
