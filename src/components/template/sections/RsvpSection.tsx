import React, { useState, type FormEvent } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { submitRsvp, type RsvpStatus } from '@/lib/rsvps';
import { ValidationError, DatabaseError } from '@/lib/errors';

export const RsvpSection: React.FC<SectionRendererProps> = ({ invitation, guest }) => {
  // Maximum allowed pax: based on personal guest allocation or default 5 (capped at 20)
  const maxPaxLimit = guest?.pax_limit ? Math.min(Math.max(guest.pax_limit, 1), 20) : 5;

  const [guestName, setGuestName] = useState(guest?.name || '');
  const [status, setStatus] = useState<RsvpStatus>('attending');
  const [paxCount, setPaxCount] = useState<number>(1);
  const [wishes, setWishes] = useState('');

  const [uiState, setUiState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (invitation.allowRsvp === false) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setErrorMessage('Nama tamu wajib diisi.');
      setUiState('error');
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage('Nama tamu maksimal 100 karakter.');
      setUiState('error');
      return;
    }

    if (wishes.length > 500) {
      setErrorMessage('Ucapan atau doa restu maksimal 500 karakter.');
      setUiState('error');
      return;
    }

    setUiState('submitting');
    setErrorMessage(null);

    try {
      await submitRsvp({
        invitation_id: invitation.id,
        guest_name: trimmedName,
        status,
        pax_count: status === 'declined' ? 1 : paxCount,
        wishes: wishes.trim() || null,
        guest_id: guest?.id || null,
      });

      setUiState('success');

      // Dispatch custom event to notify WishesSection if a wish was submitted
      if (wishes.trim()) {
        window.dispatchEvent(new CustomEvent('aurovia:wishes-updated'));
      }
    } catch (err: unknown) {
      setUiState('error');
      if (err instanceof ValidationError) {
        setErrorMessage(err.message);
      } else if (err instanceof DatabaseError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat mengirimkan RSVP. Silakan coba kembali.');
      }
    }
  };

  const handleResetForm = () => {
    setUiState('idle');
    setErrorMessage(null);
    setWishes('');
    setStatus('attending');
    setPaxCount(1);
    if (guest?.name) {
      setGuestName(guest.name);
    }
  };

  return (
    <section
      aria-labelledby="section-rsvp-heading"
      className="py-16 sm:py-24 px-6 max-w-xl mx-auto space-y-8 text-center"
    >
      <div className="space-y-3">
        <h2
          id="section-rsvp-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Konfirmasi Kehadiran
        </h2>

        <p className="text-xs sm:text-sm text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
          {guest?.name
            ? `Kepada Yth. ${guest.name}, mohon konfirmasikan kepastian kehadiran Anda untuk kelancaran acara kami.`
            : 'Kehadiran dan doa restu Anda merupakan kehormatan dan kebahagiaan bagi kami sekeluarga.'}
        </p>
      </div>

      {uiState === 'success' ? (
        <div className="p-6 sm:p-8 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--theme-color-primary)]/10 text-[var(--theme-color-primary)] flex items-center justify-center text-lg font-bold">
            ✓
          </div>
          <h3
            className="text-lg sm:text-xl font-normal text-[var(--theme-color-primary)]"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            Konfirmasi Berhasil Terkirim
          </h3>
          <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed">
            Terima kasih atas konfirmasi dan untaian doa restu yang telah Anda kirimkan. Tanggapan Anda telah tercatat dengan baik.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="py-2 px-5 rounded text-xs font-semibold border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)] hover:bg-[var(--theme-color-primary)]/5 transition-colors cursor-pointer"
            >
              Kirim Tanggapan Lain
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-left space-y-5 shadow-sm"
        >
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded text-xs border border-red-300 bg-red-50 text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Input Nama Tamu */}
          <div className="space-y-1.5">
            <label
              htmlFor="rsvp-guest-name"
              className="block text-xs font-semibold text-[var(--theme-color-primary)]"
            >
              Nama Tamu <span className="text-red-500">*</span>
            </label>
            <input
              id="rsvp-guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={uiState === 'submitting'}
              placeholder="Masukkan nama lengkap Anda"
              maxLength={100}
              required
              className="w-full py-2 px-3 rounded text-xs border border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-color-primary)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Pilihan Kehadiran */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--theme-color-primary)]">
              Kepastian Kehadiran <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('attending')}
                disabled={uiState === 'submitting'}
                className={`py-2 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  status === 'attending'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => setStatus('declined')}
                disabled={uiState === 'submitting'}
                className={`py-2 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  status === 'declined'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Tidak Hadir
              </button>
              <button
                type="button"
                onClick={() => setStatus('tentative')}
                disabled={uiState === 'submitting'}
                className={`py-2 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  status === 'tentative'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Masih Ragu
              </button>
            </div>
          </div>

          {/* Jumlah Tamu (Hanya jika Hadir atau Ragu) */}
          {status !== 'declined' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="rsvp-pax-count"
                  className="block text-xs font-semibold text-[var(--theme-color-primary)]"
                >
                  Jumlah Kehadiran (Pax)
                </label>
                {guest?.pax_limit ? (
                  <span className="text-[11px] text-[var(--theme-color-primary)]/60">
                    Batas undangan: {guest.pax_limit} orang
                  </span>
                ) : null}
              </div>
              <select
                id="rsvp-pax-count"
                value={paxCount}
                onChange={(e) => setPaxCount(Number(e.target.value))}
                disabled={uiState === 'submitting'}
                className="w-full py-2 px-3 rounded text-xs border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)] text-[var(--theme-color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-color-primary)] transition-all disabled:opacity-50"
              >
                {Array.from({ length: maxPaxLimit }, (_, i) => i + 1).map((val) => (
                  <option key={val} value={val} className="text-gray-900 bg-white">
                    {val} orang
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pesan Doa dan Ucapan */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="rsvp-wishes"
                className="block text-xs font-semibold text-[var(--theme-color-primary)]"
              >
                Ucapan & Doa Restu
              </label>
              <span className="text-[11px] text-[var(--theme-color-primary)]/60 font-mono">
                {wishes.length}/500
              </span>
            </div>
            <textarea
              id="rsvp-wishes"
              rows={3}
              value={wishes}
              onChange={(e) => setWishes(e.target.value)}
              disabled={uiState === 'submitting'}
              maxLength={500}
              placeholder="Tuliskan ucapan dan doa hangat untuk kedua mempelai..."
              className="w-full py-2 px-3 rounded text-xs border border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-color-primary)] transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Tombol Kirim */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uiState === 'submitting'}
              className="w-full py-2.5 px-4 rounded text-xs font-semibold tracking-wide border border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-center"
            >
              {uiState === 'submitting' ? 'Mengirimkan konfirmasi...' : 'Kirim Konfirmasi RSVP'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
