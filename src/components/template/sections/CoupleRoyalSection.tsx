import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';
import { DecorativeDivider, MonogramFrame } from '@/components/template/ornaments';

export const CoupleRoyalSection: React.FC<SectionRendererProps> = ({ content }) => {
  const hosts = Array.isArray(content?.hosts) ? content.hosts : [];

  return (
    <section
      id="couple"
      aria-labelledby="section-couple-royal-heading"
      className="py-16 sm:py-24 px-6 max-w-3xl mx-auto space-y-10 relative z-10"
    >
      <div className="text-center space-y-2">
        <h2
          id="section-couple-royal-heading"
          className="text-2xl sm:text-4xl font-normal text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          Kedua Mempelai
        </h2>
        <DecorativeDivider variant="royal" />
      </div>

      {hosts.length === 0 ? (
        <div className="p-6 border border-[var(--template-border,#D4AF37)]/30 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/50 backdrop-blur-sm text-center text-xs text-[var(--template-text,#FFFFFF)]/70">
          Informasi mempelai belum dikonfigurasi.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {hosts.map((host, idx) => {
            const photoUrl = host.storage_path
              ? getGalleryPublicUrl(host.storage_path)
              : host.photo_url
              ? getGalleryPublicUrl(host.photo_url)
              : null;

            const name = String(host?.name || '').trim();
            const initial = name ? name.charAt(0).toUpperCase() : '?';

            return (
              <div
                key={host.id || idx}
                className="p-6 sm:p-8 border border-[var(--template-border,#D4AF37)]/35 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md text-center flex flex-col items-center space-y-5 shadow-md hover:border-[var(--template-accent,#D4AF37)] transition-all duration-300 group"
              >
                {/* Monogram Lingkaran Emas atau Foto */}
                <MonogramFrame
                  photoUrl={photoUrl}
                  alt={name ? `Foto ${name}` : 'Foto mempelai'}
                  initials={initial}
                  variant="royal-circle"
                />

                <div className="space-y-2 w-full">
                  <h3
                    className="font-normal text-2xl sm:text-3xl text-[var(--template-accent,#D4AF37)]"
                    style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
                  >
                    {name || 'Nama Mempelai'}
                  </h3>

                  {host?.role ? (
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-[var(--template-text,#FFFFFF)]/80">
                      {String(host.role)}
                    </p>
                  ) : null}

                  <div className="w-12 h-px bg-[var(--template-border,#D4AF37)]/40 mx-auto my-2" />

                  {host?.parents ? (
                    <p className="text-xs text-[var(--template-text,#FFFFFF)]/85 pt-1 leading-relaxed">
                      {String(host.parents)}
                    </p>
                  ) : null}

                  {host?.bio ? (
                    <p className="text-xs italic text-[var(--template-text,#FFFFFF)]/75 pt-1 leading-relaxed">
                      &ldquo;{String(host.bio)}&rdquo;
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
