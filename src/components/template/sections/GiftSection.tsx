import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const GiftSection: React.FC<SectionRendererProps> = ({ content }) => {
  const accounts = Array.isArray(content?.financial_accounts)
    ? content.financial_accounts
    : [];

  return (
    <section aria-labelledby="section-gift-heading" className="py-16 px-6 max-w-xl mx-auto space-y-6 text-center">
      <h2
        id="section-gift-heading"
        className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Tanda Kasih
      </h2>

      <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
        Bagi keluarga dan sahabat yang hendak memberikan tanda kasih, dapat melalui nomor rekening berikut:
      </p>

      {accounts.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70">
          Informasi nomor rekening belum dikonfigurasi.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc, idx) => (
            <div
              key={idx}
              className="p-4 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs space-y-1"
            >
              <p className="font-semibold text-sm text-[var(--theme-color-primary)]">{acc.bank_name}</p>
              <p className="font-mono text-sm tracking-wider text-[var(--theme-color-primary)] font-bold">
                {acc.account_number}
              </p>
              {acc.holder_name ? (
                <p className="text-xs text-[var(--theme-color-primary)]/70">a.n. {acc.holder_name}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
