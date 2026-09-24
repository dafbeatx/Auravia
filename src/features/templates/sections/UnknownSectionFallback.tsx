import React from 'react';
import type { SectionRendererProps } from '../types';

export const UnknownSectionFallback: React.FC<SectionRendererProps> = ({
  sectionType,
}) => {
  // Hanya tampilkan catatan aman tanpa merusak struktur halaman
  return (
    <div className="py-4 px-6 my-4 border border-dashed border-[var(--theme-color-border)] rounded max-w-2xl mx-auto text-center text-xs text-[var(--theme-color-primary)]/60">
      Seksi tipe &ldquo;{sectionType}&rdquo; belum memiliki modul perender terdaftar.
    </div>
  );
};
