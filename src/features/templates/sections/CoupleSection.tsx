import React from 'react';
import type { SectionRendererProps } from '../types';

export const CoupleSection: React.FC<SectionRendererProps> = ({ content }) => {
  const hosts = Array.isArray(content?.hosts) ? content.hosts : [];

  return (
    <section aria-labelledby="section-couple-heading" className="py-16 px-6 max-w-2xl mx-auto space-y-8">
      <h2
        id="section-couple-heading"
        className="text-2xl sm:text-3xl font-normal text-center text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Mempelai
      </h2>

      {hosts.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Informasi mempelai belum dikonfigurasi.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {hosts.map((host, idx) => (
            <div
              key={idx}
              className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center space-y-2"
            >
              <h3
                className="font-normal text-xl text-[var(--theme-color-primary)]"
                style={{ fontFamily: 'var(--theme-font-heading)' }}
              >
                {String(host?.name || '')}
              </h3>
              {host?.role ? (
                <p className="text-xs text-[var(--theme-color-primary)]/70">
                  {String(host.role)}
                </p>
              ) : null}
              {host?.bio ? (
                <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed pt-1">
                  {String(host.bio)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const HostsSection = CoupleSection;
