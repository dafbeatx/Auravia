import React from 'react';
import type { SectionRendererProps } from '../types';

export const GiftSection: React.FC<SectionRendererProps> = ({ content }) => {
  const accounts = Array.isArray(content?.financial_accounts)
    ? content.financial_accounts
    : [];

  return (
    <section aria-labelledby="section-gift-heading" className="py-16 px-6 max-w-2xl mx-auto space-y-6">
      <h2
        id="section-gift-heading"
        className="text-2xl sm:text-3xl font-normal text-center text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Tanda Kasih
      </h2>

      {accounts.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Informasi tanda kasih dan rekening belum diatur.
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((acc, idx) => (
            <div
              key={idx}
              className="p-5 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center space-y-1"
            >
              <p className="font-semibold text-sm text-[var(--theme-color-primary)]">
                {String(acc?.bank_name || 'Bank')}
              </p>
              <p className="font-mono text-xs text-[var(--theme-color-primary)]/90 tracking-wider">
                {String(acc?.account_number || '')}
              </p>
              {acc?.holder_name ? (
                <p className="text-xs text-[var(--theme-color-primary)]/70">
                  a.n. {String(acc.holder_name)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
