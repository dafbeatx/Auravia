import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';
import { DecorativeDivider, MonogramFrame } from '@/components/template/ornaments';

export const CoupleSection: React.FC<SectionRendererProps> = ({ content }) => {
  const hosts = Array.isArray(content?.hosts) ? content.hosts : [];

  return (
    <section id="couple" aria-labelledby="section-couple-heading" className="py-16 sm:py-24 px-6 max-w-3xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h2
          id="section-couple-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Kedua Mempelai
        </h2>
        <DecorativeDivider variant="diamond" />
      </div>

      {hosts.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded-[var(--theme-radius-card)] bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
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
                className="p-6 sm:p-8 border border-[var(--theme-color-border)] rounded-[var(--theme-radius-card)] bg-[var(--theme-color-surface)] text-center flex flex-col items-center space-y-5 shadow-xs transition-all hover:border-[var(--theme-color-accent)] group"
              >
                {/* Foto atau Monogram Fallback */}
                <MonogramFrame
                  photoUrl={photoUrl}
                  alt={name ? `Foto ${name}` : 'Foto mempelai'}
                  initials={initial}
                  variant="classic-ring"
                />

                <div className="space-y-1.5 w-full">
                  <h3
                    className="font-normal text-xl sm:text-2xl text-[var(--theme-color-primary)]"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    {name || 'Nama Mempelai'}
                  </h3>

                  {host?.role ? (
                    <p className="text-xs uppercase tracking-widest font-semibold text-[var(--theme-color-accent)]">
                      {String(host.role)}
                    </p>
                  ) : null}

                  <div className="w-10 h-px bg-[var(--theme-color-border)]/40 mx-auto my-2" />

                  {host?.parents ? (
                    <p className="text-xs text-[var(--theme-color-primary)]/80 pt-1 leading-relaxed">
                      {String(host.parents)}
                    </p>
                  ) : null}

                  {host?.bio ? (
                    <p className="text-xs italic text-[var(--theme-color-primary)]/70 pt-1 leading-relaxed">
                      {String(host.bio)}
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

export const HostsSection = CoupleSection;
