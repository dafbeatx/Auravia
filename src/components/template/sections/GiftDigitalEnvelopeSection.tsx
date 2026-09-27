import React, { useState, useMemo } from 'react';
import type {
  SectionRendererProps,
  InvitationContentGiftAccount,
} from '@/lib/template/types';
import { DecorativeDivider } from '@/components/template/ornaments';

export const GiftDigitalEnvelopeSection: React.FC<SectionRendererProps> = ({ content }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const giftConfig = content?.gift;
  const isEnabled = giftConfig ? giftConfig.is_enabled !== false : true;

  const resolvedAccounts: InvitationContentGiftAccount[] = useMemo(() => {
    if (Array.isArray(giftConfig?.accounts) && giftConfig.accounts.length > 0) {
      return giftConfig.accounts
        .filter((acc) => acc.is_enabled !== false)
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    if (Array.isArray(content?.financial_accounts) && content.financial_accounts.length > 0) {
      return content.financial_accounts.map((acc, idx) => ({
        id: `legacy-${idx}`,
        type: 'bank' as const,
        provider: acc.bank_name || 'Bank Transfer',
        account_number: acc.account_number || '',
        holder_name: acc.holder_name || '',
        display_order: idx,
        is_enabled: true,
      }));
    }

    return [];
  }, [giftConfig?.accounts, content?.financial_accounts]);

  const physicalAddress = giftConfig?.physical_address;
  const hasPhysicalAddress = Boolean(
    physicalAddress?.is_enabled && physicalAddress.address?.trim()
  );

  if (!isEnabled || (resolvedAccounts.length === 0 && !hasPhysicalAddress)) {
    return null;
  }

  const title = giftConfig?.title?.trim() || 'Tanda Kasih';
  const description =
    giftConfig?.description?.trim() ||
    'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda hendak memberikan tanda kasih, Anda dapat menyalurkannya melalui dompet digital atau rekening berikut:';

  const handleCopyText = async (text: string, key: string) => {
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
        return;
      }
    } catch {
      // Fallback ke execCommand
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      }
    } catch {
      // Abaikan jika papan klip tidak dapat diakses
    }
  };

  return (
    <section
      id="gift"
      aria-labelledby="section-gift-royal-heading"
      className="py-16 sm:py-24 px-6 max-w-xl mx-auto space-y-8 text-center relative z-10"
    >
      <div className="space-y-3">
        <h2
          id="section-gift-royal-heading"
          className="text-2xl sm:text-4xl font-normal text-[var(--template-accent,#D4AF37)]"
          style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
        >
          {title}
        </h2>
        <DecorativeDivider variant="royal" />

        {description ? (
          <p className="text-xs sm:text-sm text-[var(--template-text,#FFFFFF)]/80 leading-relaxed max-w-md mx-auto pt-1">
            {description}
          </p>
        ) : null}
      </div>

      {resolvedAccounts.length > 0 && (
        <div className="space-y-4">
          {resolvedAccounts.map((acc, idx) => {
            const copyKey = `acc-${acc.id || idx}`;
            const isCopied = copiedKey === copyKey;
            const isEwallet = acc.type === 'ewallet';

            return (
              <div
                key={acc.id || idx}
                className="p-5 sm:p-6 border border-[var(--template-border,#D4AF37)]/40 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md text-left space-y-4 shadow-md hover:border-[var(--template-accent,#D4AF37)] transition-all"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--template-border,#D4AF37)]/30 pb-3">
                  <div className="space-y-0.5">
                    <span
                      className="font-normal text-base sm:text-lg text-[var(--template-accent,#D4AF37)]"
                      style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
                    >
                      {acc.provider}
                    </span>
                    {acc.label ? (
                      <p className="text-[11px] text-[var(--template-text,#FFFFFF)]/70">
                        {acc.label}
                      </p>
                    ) : null}
                  </div>

                  <span className="text-[10px] px-3 py-1 rounded-full border border-[var(--template-border,#D4AF37)]/40 bg-[var(--template-surface,#1E3A5F)]/80 text-[var(--template-accent,#D4AF37)] font-medium uppercase tracking-wider">
                    {isEwallet ? 'E-Wallet' : 'Bank'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--template-text,#FFFFFF)]/60 block">
                    {isEwallet ? 'Nomor Akun / Ponsel' : 'Nomor Rekening'}
                  </span>
                  <div className="font-mono text-base sm:text-xl font-bold tracking-widest text-[var(--template-accent,#D4AF37)] select-all">
                    {acc.account_number}
                  </div>
                  {acc.holder_name ? (
                    <p className="text-xs text-[var(--template-text,#FFFFFF)]/85 font-medium">
                      a.n. {acc.holder_name}
                    </p>
                  ) : null}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(acc.account_number, copyKey)}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border border-[var(--template-accent,#D4AF37)] bg-[var(--template-accent,#D4AF37)] text-[#0A1324] hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    aria-label={`Salin nomor ${isEwallet ? 'akun' : 'rekening'} ${acc.provider}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      {isCopied ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      )}
                    </svg>
                    <span>{isCopied ? 'Tersalin!' : 'Salin Nomor'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasPhysicalAddress && physicalAddress && (
        <div className="p-6 border border-[var(--template-border,#D4AF37)]/40 rounded-2xl bg-[var(--template-surface,#1E3A5F)]/60 backdrop-blur-md text-left space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--template-border,#D4AF37)]/30 pb-2.5">
            <span
              className="font-normal text-base text-[var(--template-accent,#D4AF37)]"
              style={{ fontFamily: 'var(--template-heading-font, "Playfair Display", serif)' }}
            >
              Kirim Kado Fisik
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[var(--template-border,#D4AF37)]/40 bg-[var(--template-surface,#1E3A5F)]/80 text-[var(--template-accent,#D4AF37)] uppercase">
              Alamat
            </span>
          </div>

          <div className="space-y-1">
            {physicalAddress.recipient_name ? (
              <p className="text-xs font-semibold text-[var(--template-text,#FFFFFF)]">
                Penerima: {physicalAddress.recipient_name}
              </p>
            ) : null}
            {physicalAddress.phone ? (
              <p className="text-xs text-[var(--template-text,#FFFFFF)]/75">
                No. Telp: {physicalAddress.phone}
              </p>
            ) : null}
            <p className="text-xs text-[var(--template-text,#FFFFFF)]/85 pt-1 leading-relaxed">
              {physicalAddress.address}
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleCopyText(physicalAddress.address, 'physical-addr')}
              className="w-full min-h-[44px] py-2 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border border-[var(--template-accent,#D4AF37)]/60 text-[var(--template-accent,#D4AF37)] hover:bg-[var(--template-accent,#D4AF37)] hover:text-[#0A1324] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{copiedKey === 'physical-addr' ? 'Alamat Tersalin!' : 'Salin Alamat'}</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
