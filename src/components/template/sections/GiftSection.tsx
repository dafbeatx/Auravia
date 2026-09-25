import React, { useState } from 'react';
import type {
  SectionRendererProps,
  InvitationContentGiftAccount,
} from '@/lib/template/types';

export const GiftSection: React.FC<SectionRendererProps> = ({ content }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const giftConfig = content?.gift;
  const isEnabled = giftConfig ? giftConfig.is_enabled !== false : true;

  // Resolusi data rekening atau dompet digital (modern atau warisan)
  const resolvedAccounts: InvitationContentGiftAccount[] = React.useMemo(() => {
    if (Array.isArray(giftConfig?.accounts) && giftConfig.accounts.length > 0) {
      return giftConfig.accounts
        .filter((acc) => acc.is_enabled !== false)
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    // Dukungan data warisan (legacy financial_accounts)
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

  // Jika fitur hadiah dinonaktifkan atau belum ada rekening & alamat yang dikonfigurasi,
  // jangan tampilkan seksi kosong di undangan publik.
  if (!isEnabled || (resolvedAccounts.length === 0 && !hasPhysicalAddress)) {
    return null;
  }

  const title = giftConfig?.title?.trim() || 'Tanda Kasih';
  const description =
    giftConfig?.description?.trim() ||
    'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda hendak memberikan tanda kasih, Anda dapat menyalurkannya melalui:';

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
      aria-labelledby="section-gift-heading"
      className="py-16 sm:py-24 px-6 max-w-xl mx-auto space-y-8 text-center"
    >
      <div className="space-y-3">
        <h2
          id="section-gift-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          {title}
        </h2>

        {description ? (
          <p className="text-xs sm:text-sm text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        ) : null}
      </div>

      {/* Daftar Rekening Bank & Dompet Digital */}
      {resolvedAccounts.length > 0 ? (
        <div className="space-y-4">
          {resolvedAccounts.map((acc, idx) => {
            const copyKey = `acc-${acc.id || idx}`;
            const isCopied = copiedKey === copyKey;
            const isEwallet = acc.type === 'ewallet';

            return (
              <div
                key={acc.id || idx}
                className="p-5 sm:p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-left space-y-3.5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-color-border)]/50 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-[var(--theme-color-primary)]">
                      {acc.provider}
                    </span>
                    {acc.label ? (
                      <p className="text-[11px] text-[var(--theme-color-primary)]/70">
                        {acc.label}
                      </p>
                    ) : null}
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-primary)]/5 text-[var(--theme-color-primary)] font-medium uppercase tracking-wider">
                    {isEwallet ? 'E-Wallet' : 'Bank'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--theme-color-primary)]/60 block">
                    {isEwallet ? 'Nomor Akun / Ponsel' : 'Nomor Rekening'}
                  </span>
                  <div className="font-mono text-base sm:text-lg font-bold tracking-wider text-[var(--theme-color-primary)] select-all">
                    {acc.account_number}
                  </div>
                  {acc.holder_name ? (
                    <p className="text-xs text-[var(--theme-color-primary)]/80 font-medium">
                      a.n. {acc.holder_name}
                    </p>
                  ) : null}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(acc.account_number, copyKey)}
                    className="w-full py-2.5 px-3 rounded text-xs font-semibold border border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)] hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    {isCopied ? 'Nomor Berhasil Disalin!' : isEwallet ? 'Salin Nomor E-Wallet' : 'Salin Nomor Rekening'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Alamat Pengiriman Kado Fisik */}
      {hasPhysicalAddress && physicalAddress ? (
        <div className="p-5 sm:p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-left space-y-3.5 shadow-xs">
          <div className="border-b border-[var(--theme-color-border)]/50 pb-2.5 flex items-center justify-between">
            <span className="font-semibold text-sm text-[var(--theme-color-primary)]">
              Kirim Hadiah Fisik
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-primary)]/5 text-[var(--theme-color-primary)] font-medium uppercase tracking-wider">
              Alamat
            </span>
          </div>

          <div className="space-y-2 text-xs text-[var(--theme-color-primary)]/90 leading-relaxed">
            {physicalAddress.recipient_name ? (
              <p>
                <strong className="text-[var(--theme-color-primary)] font-semibold">Penerima: </strong>
                {physicalAddress.recipient_name}
              </p>
            ) : null}

            <p className="whitespace-pre-wrap bg-[var(--theme-color-primary)]/5 p-3 rounded border border-[var(--theme-color-border)]/50 font-medium">
              {physicalAddress.address}
            </p>

            {physicalAddress.phone ? (
              <p className="text-[11px] text-[var(--theme-color-primary)]/80">
                <span className="font-semibold">Telepon / WhatsApp: </span>
                {physicalAddress.phone}
              </p>
            ) : null}

            {physicalAddress.notes ? (
              <p className="text-[11px] text-[var(--theme-color-primary)]/70 italic">
                Catatan: {physicalAddress.notes}
              </p>
            ) : null}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                const fullAddressText = [
                  physicalAddress.recipient_name ? `Penerima: ${physicalAddress.recipient_name}` : '',
                  physicalAddress.address,
                  physicalAddress.phone ? `Telp: ${physicalAddress.phone}` : '',
                ]
                  .filter(Boolean)
                  .join('\n');
                handleCopyText(fullAddressText, 'address');
              }}
              className="w-full py-2.5 px-3 rounded text-xs font-semibold border border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)] hover:bg-[var(--theme-color-primary)]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {copiedKey === 'address' ? 'Alamat Berhasil Disalin!' : 'Salin Alamat Lengkap'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};
