import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getGalleryPublicUrl } from '@/lib/invitations';

export const CoupleSection: React.FC<SectionRendererProps> = ({ content }) => {
  const hosts = Array.isArray(content?.hosts) ? content.hosts : [];

  return (
    <section aria-labelledby="section-couple-heading" className="py-16 px-6 max-w-3xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h2
          id="section-couple-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Mempelai
        </h2>
        <div className="w-10 h-px bg-[var(--theme-color-border)] mx-auto" />
      </div>

      {hosts.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
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
                className="p-6 border border-[var(--theme-color-border)] rounded-lg bg-[var(--theme-color-surface)] text-center flex flex-col items-center space-y-4"
              >
                {/* Foto atau Monogram Fallback */}
                <div className="relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name ? `Foto ${name}` : 'Foto mempelai'}
                      loading="lazy"
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-[var(--theme-color-border)] shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[var(--theme-color-border)] bg-[var(--theme-color-background)]/60 flex items-center justify-center text-2xl font-light text-[var(--theme-color-primary)]/60 select-none shadow-sm"
                      style={{ fontFamily: 'var(--theme-font-heading)' }}
                      aria-label="Foto belum tersedia"
                    >
                      {initial}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 w-full">
                  <h3
                    className="font-normal text-xl sm:text-2xl text-[var(--theme-color-primary)]"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    {name || 'Nama Mempelai'}
                  </h3>

                  {host?.role ? (
                    <p className="text-xs uppercase tracking-wider font-medium text-[var(--theme-color-primary)]/70">
                      {String(host.role)}
                    </p>
                  ) : null}

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
