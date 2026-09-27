import React, { useState, useEffect, useCallback } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';
import { DecorativeDivider } from '@/components/template/ornaments';

export const GalleryRoyalSection: React.FC<SectionRendererProps> = ({ gallery }) => {
  const images = gallery && gallery.length > 0 ? gallery : [];
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
      }
    },
    [selectedPhotoIndex, images.length]
  );

  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedPhotoIndex, handleKeyDown]);

  const activePhoto = selectedPhotoIndex !== null ? images[selectedPhotoIndex] : null;

  return (
    <section
      id="gallery"
      aria-labelledby="section-gallery-royal-heading"
      className="py-16 sm:py-24 px-6 max-w-4xl mx-auto space-y-8 relative z-10"
    >
      <div className="text-center space-y-2">
        <h2
          id="section-gallery-royal-heading"
          className="text-2xl sm:text-4xl font-normal text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          Galeri Foto
        </h2>
        <DecorativeDivider variant="royal" />
      </div>

      {images.length === 0 ? (
        <div className="p-6 border border-[var(--template-border,#D4AF37)]/30 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/50 backdrop-blur-sm text-center text-xs text-[var(--template-text,#FFFFFF)]/70">
          Belum ada dokumentasi foto yang ditambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {images.map((img, idx) => {
            const photoUrl = getGalleryPublicUrl(img.storage_path || img.thumbnail_path || '');
            return (
              <div
                key={img.id}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative rounded-xl overflow-hidden border border-[var(--template-border,#D4AF37)]/35 bg-[var(--template-surface,#1E3A5F)]/40 shadow-sm cursor-pointer aspect-4/5 transition-all duration-300 hover:border-[var(--template-accent,#D4AF37)] hover:shadow-lg"
              >
                <img
                  src={photoUrl}
                  alt={img.caption || 'Foto dokumentasi acara'}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1324]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  {img.caption ? (
                    <p className="text-[11px] text-[var(--template-text,#FFFFFF)] line-clamp-2">
                      {img.caption}
                    </p>
                  ) : (
                    <span className="text-[10px] text-[var(--template-accent,#D4AF37)] uppercase tracking-wider">
                      Perbesar Foto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan Penuh Foto Galeri"
          className="fixed inset-0 z-50 bg-[#0A1324]/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute -top-12 right-0 min-h-[44px] min-w-[44px] p-2 text-[var(--template-accent,#D4AF37)] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Tutup Tampilan Foto"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={getGalleryPublicUrl(activePhoto.storage_path || activePhoto.thumbnail_path || '')}
              alt={activePhoto.caption || 'Foto dokumentasi penuh'}
              className="max-h-[75vh] w-auto rounded-xl border border-[var(--template-border,#D4AF37)]/50 shadow-2xl object-contain"
            />

            {activePhoto.caption && (
              <p className="mt-3 text-xs sm:text-sm text-center text-[var(--template-text,#FFFFFF)]/90 italic">
                {activePhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
