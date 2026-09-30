import React, { useState, useEffect, useCallback } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';
import { DecorativeDivider } from '@/components/template/ornaments';

export const GallerySection: React.FC<SectionRendererProps> = ({ gallery }) => {
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
      aria-labelledby="section-gallery-heading"
      className="py-16 sm:py-24 px-6 max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2
          id="section-gallery-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Galeri Foto
        </h2>
        <DecorativeDivider variant="diamond" />
      </div>

      {images.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded-2xl bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Belum ada foto yang ditambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {images.map((img, idx) => {
            const photoUrl = getGalleryPublicUrl(img.storage_path || img.thumbnail_path || '');
            return (
              <div
                key={img.id}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative rounded-xl overflow-hidden border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] shadow-xs cursor-pointer aspect-3/4 transition-all duration-300 hover:shadow-md hover:border-[var(--theme-color-accent)]"
              >
                <img
                  src={photoUrl}
                  alt={img.caption || 'Foto dokumentasi acara'}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  {img.caption ? (
                    <p className="text-[11px] text-white line-clamp-2">
                      {img.caption}
                    </p>
                  ) : (
                    <span className="text-[10px] text-white/90 uppercase tracking-wider">
                      Lihat Foto
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              aria-label="Tutup Tampilan Penuh"
              className="absolute -top-12 right-0 p-2 text-white hover:text-white/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={getGalleryPublicUrl(activePhoto.storage_path || activePhoto.thumbnail_path || '')}
              alt={activePhoto.caption || 'Foto dokumentasi acara'}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
            />

            {activePhoto.caption && (
              <p className="mt-3 text-xs sm:text-sm text-center text-white/90 max-w-lg leading-relaxed">
                {activePhoto.caption}
              </p>
            )}

            {/* Navigasi Sebelumnya / Selanjutnya */}
            {images.length > 1 && (
              <div className="flex items-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : images.length - 1
                    )
                  }
                  aria-label="Foto Sebelumnya"
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-white/70">
                  {(selectedPhotoIndex ?? 0) + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev !== null && prev < images.length - 1 ? prev + 1 : 0
                    )
                  }
                  aria-label="Foto Selanjutnya"
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
