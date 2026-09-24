import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const UnknownSectionFallback: React.FC<SectionRendererProps> = ({ sectionType }) => {
  // Hanya tampilkan notice di lingkungan development agar tidak merusak tampilan publik
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      role="note"
      className="my-4 p-4 border border-dashed border-amber-300 bg-amber-50/50 rounded text-center text-xs text-amber-800"
    >
      Seksi &ldquo;{sectionType}&rdquo; belum memiliki komponen renderer terdaftar.
    </div>
  );
};
