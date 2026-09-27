import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';
import { DecorativeDivider } from '@/components/template/ornaments';

export const GallerySection: React.FC<SectionRendererProps> = ({ gallery }) => {
  const images = gallery && gallery.length > 0 ? gallery : [];

  return (
    <section id="gallery" aria-labelledby="section-gallery-heading" className="py-16 sm:py-24 px-6 max-w-3xl mx-auto space-y-8">
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
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Belum ada foto yang ditambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="border border-[var(--theme-color-border)] rounded overflow-hidden bg-[var(--theme-color-surface)]"
            >
              <img
                src={getGalleryPublicUrl(img.storage_path || img.thumbnail_path || '')}
                alt={img.caption || 'Foto dokumentasi acara'}
                loading="lazy"
                className="w-full h-48 object-cover"
              />
              {img.caption ? (
                <p className="p-2.5 text-xs text-center text-[var(--theme-color-primary)]/80 italic">
                  {img.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
