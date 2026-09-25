import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { InvitationContentCover, InvitationContent } from '@/lib/template/types';
import { isValidWebUrl } from '@/lib/urls';

export interface CoverEnvelopeProps {
  cover?: InvitationContentCover | null;
  invitation: {
    id: string;
    title: string;
    slug: string;
    eventType?: string;
  };
  content?: InvitationContent | null;
  events?: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string | null;
    venue_name: string;
    is_primary: boolean;
  }>;
  guest?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  onOpen?: () => void;
  containerPosition?: 'fixed' | 'absolute';
}

/**
 * Komponen Pengalaman Pembuka Sampul Undangan (Cover Envelope Experience v1):
 * - Membuka undangan digital dengan nuansa amplop / sampul fisik yang elegan
 * - Interaksi tombol "Buka Undangan" menjadi user gesture resmi untuk memulai background music
 * - Menghormati pengaturan prefers-reduced-motion dan aksesibilitas WCAG AA
 * - Fallback cerdas tanpa gambar dummy atau manipulasi data palsu
 */
export const CoverEnvelope: React.FC<CoverEnvelopeProps> = ({
  cover,
  invitation,
  content,
  events,
  guest,
  onOpen,
  containerPosition = 'fixed',
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Periksa apakah preferensi reduced motion diaktifkan di sistem operasi pengguna
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Kunci scroll halaman publik saat cover masih aktif
  useEffect(() => {
    if (containerPosition === 'fixed' && !isDismissed) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [containerPosition, isDismissed]);

  // Ekstraksi data acara dan penanggalan riil
  const primaryEvent = events?.find((e) => e.is_primary) ?? events?.[0];
  const formattedEventDate = useMemo(() => {
    if (!primaryEvent?.start_time) return null;
    const dateObj = new Date(primaryEvent.start_time);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [primaryEvent?.start_time]);

  // Ekstraksi nama mempelai dari data hosts atau konfigurasi hero yang sudah ada
  const hostNames = useMemo(() => {
    if (!Array.isArray(content?.hosts)) return [];
    return content.hosts
      .map((h) => h?.name?.trim())
      .filter((n): n is string => Boolean(n && n.length > 0));
  }, [content?.hosts]);

  const autoCoupleNames = useMemo(() => {
    if (content?.hero?.couple_names?.trim()) {
      return content.hero.couple_names.trim();
    }
    if (hostNames.length >= 2) {
      return `${hostNames[0]} & ${hostNames[1]}`;
    }
    if (hostNames.length === 1) {
      return hostNames[0];
    }
    return invitation.title;
  }, [content?.hero?.couple_names, hostNames, invitation.title]);

  // Teks tampilan Cover
  const eyebrowText = cover?.eyebrow?.trim() || 'The Wedding Of';
  const displayTitle = cover?.title?.trim() || autoCoupleNames;

  // Subjudul otomatis dari tanggal dan lokasi acara
  const autoSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (formattedEventDate) parts.push(formattedEventDate);
    if (primaryEvent?.venue_name?.trim()) parts.push(primaryEvent.venue_name.trim());
    return parts.join(' • ');
  }, [formattedEventDate, primaryEvent?.venue_name]);

  const displaySubtitle = cover?.subtitle?.trim() || autoSubtitle;
  const buttonLabel = cover?.button_label?.trim() || 'Buka Undangan';

  // Verifikasi keamanan URL gambar latar
  const validBackgroundUrl = useMemo(() => {
    const rawUrl = cover?.background_image_url?.trim();
    if (rawUrl && isValidWebUrl(rawUrl)) {
      return rawUrl;
    }
    return null;
  }, [cover?.background_image_url]);

  const overlayOpacity = Math.max(0, Math.min(1, typeof cover?.overlay_opacity === 'number' ? cover.overlay_opacity : 0.4));

  // Handler klik tombol buka undangan
  const handleOpenInvitation = useCallback(() => {
    if (isOpening || isDismissed) return;

    setIsOpening(true);

    // Kirim sinyal resmi pemicu pemutaran audio dalam satu alur interaksi pengguna
    try {
      window.dispatchEvent(new CustomEvent('aurovia:play-music'));
    } catch {
      // Abaikan jika browser tidak mendukung custom event dispatch
    }

    // Durasi animasi transisi (500 sampai 900 ms) atau instan bila reduced motion
    const animationDuration = prefersReducedMotion ? 60 : 750;

    const timer = window.setTimeout(() => {
      setIsDismissed(true);
      setIsOpening(false);
      onOpen?.();
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [isOpening, isDismissed, prefersReducedMotion, onOpen]);

  if (isDismissed) {
    return null;
  }

  const positionClasses = containerPosition === 'fixed' ? 'fixed inset-0 z-50' : 'absolute inset-0 z-40';

  return (
    <section
      aria-label="Sampul Pembuka Undangan"
      className={`${positionClasses} w-full h-[100dvh] min-h-[100dvh] overflow-y-auto flex flex-col justify-between items-center px-4 py-8 sm:py-12 transition-all ease-in-out ${
        prefersReducedMotion ? 'duration-150' : 'duration-750'
      } ${
        isOpening
          ? 'opacity-0 -translate-y-6 scale-[0.98] pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      } bg-[var(--theme-color-background)] text-[var(--theme-color-primary)] select-none`}
    >
      {/* Background Image Layer (Hanya jika URL valid tersedia) */}
      {validBackgroundUrl && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={validBackgroundUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay Penyesuai Kontras */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Background Elegan Fallback (Bila tanpa gambar) */}
      {!validBackgroundUrl && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,var(--theme-color-surface)_0%,transparent_70%)]"
          aria-hidden="true"
        />
      )}

      {/* Bagian Atas: Eyebrow Khidmat */}
      <div className="relative z-10 w-full text-center pt-2 sm:pt-6">
        <p
          className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--theme-color-primary)]/80 inline-block px-4 py-1.5 rounded-full border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/70 backdrop-blur-xs"
        >
          {eyebrowText}
        </p>
      </div>

      {/* Bagian Tengah: Fokus Utama Nama Pasangan & Informasi */}
      <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-6 sm:space-y-8 my-auto py-6">
        <div className="space-y-3">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.15] tracking-tight drop-shadow-xs"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {displayTitle}
          </h1>

          {displaySubtitle && (
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[var(--theme-color-primary)]/85 max-w-md mx-auto leading-relaxed">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Kartu Sapaan Personal Tamu (Jika Tersedia) */}
        {guest?.name && (
          <div className="inline-flex flex-col items-center gap-1.5 py-3 px-6 rounded-xl border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/90 backdrop-blur-md shadow-xs max-w-xs mx-auto">
            <span className="text-[10px] uppercase tracking-widest text-[var(--theme-color-primary)]/70 font-semibold">
              Kepada Yth. Bapak/Ibu/Saudara/i:
            </span>
            <span
              className="text-base sm:text-lg font-medium text-[var(--theme-color-primary)] break-words text-center"
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {guest.name}
            </span>
          </div>
        )}
      </div>

      {/* Bagian Bawah: Tombol Pembuka "Buka Undangan" */}
      <div className="relative z-10 w-full text-center pb-4 sm:pb-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleOpenInvitation}
          disabled={isOpening}
          aria-label={buttonLabel}
          aria-busy={isOpening}
          className="group relative inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] hover:bg-[var(--theme-color-primary)] text-[var(--theme-color-primary)] hover:text-[var(--theme-color-background)] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-color-primary)] focus-visible:ring-offset-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {/* Ikon Amplop Elegan */}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpening ? 'scale-125 rotate-12' : 'group-hover:scale-110'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>{isOpening ? 'Membuka...' : buttonLabel}</span>
        </button>

        <p className="text-[11px] text-[var(--theme-color-primary)]/60 tracking-wider">
          Sentuh untuk membuka undangan digital
        </p>
      </div>
    </section>
  );
};
