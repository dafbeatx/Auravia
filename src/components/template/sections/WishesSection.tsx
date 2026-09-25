import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getPublicWishes, submitRsvp, type PublicRsvpWish, type RsvpStatus } from '@/lib/rsvps';
import { ValidationError, DatabaseError } from '@/lib/errors';

function formatWishDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const WishesSection: React.FC<SectionRendererProps> = ({ invitation, guest }) => {
  const [wishesList, setWishesList] = useState<PublicRsvpWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Form Kirim Ucapan
  const [guestName, setGuestName] = useState(guest?.name || '');
  const [wishText, setWishText] = useState('');
  const [attendance, setAttendance] = useState<RsvpStatus>('attending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const loadWishes = useCallback(async () => {
    if (invitation.showWishes === false) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicWishes(invitation.id, 50, 0);
      setWishesList(data);
    } catch {
      setError('Gagal memuat ucapan dan doa restu. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }, [invitation.id, invitation.showWishes]);

  useEffect(() => {
    if (invitation.showWishes === false) return;

    loadWishes();

    const handleWishesUpdated = () => {
      loadWishes();
    };

    window.addEventListener('aurovia:wishes-updated', handleWishesUpdated);
    return () => {
      window.removeEventListener('aurovia:wishes-updated', handleWishesUpdated);
    };
  }, [loadWishes, invitation.showWishes]);

  const handleSubmitWish = async (e: FormEvent) => {
    e.preventDefault();
    const cleanName = guestName.trim();
    const cleanWish = wishText.trim();

    if (!cleanName) {
      setFormError('Nama pengirim wajib diisi.');
      return;
    }
    if (cleanName.length > 100) {
      setFormError('Nama pengirim maksimal 100 karakter.');
      return;
    }
    if (!cleanWish) {
      setFormError('Untaian doa atau ucapan wajib diisi.');
      return;
    }
    if (cleanWish.length > 500) {
      setFormError('Ucapan atau doa maksimal 500 karakter.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const created = await submitRsvp({
        invitation_id: invitation.id,
        guest_name: cleanName,
        status: attendance,
        pax_count: 1,
        wishes: cleanWish,
        guest_id: guest?.id || null,
      });

      // Tambahkan ucapan baru ke daftar lokal secara langsung tanpa reload atau polling
      const newEntry: PublicRsvpWish = {
        id: created.id,
        invitation_id: created.invitation_id,
        guest_name: created.guest_name,
        wishes: created.wishes,
        created_at: created.created_at,
      };

      setWishesList((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)]);
      setWishText('');
      setFormSuccess(true);

      // Beritahu komponen lain bahwa ucapan baru telah ditambahkan
      window.dispatchEvent(new CustomEvent('aurovia:wishes-updated'));
    } catch (err: unknown) {
      if (err instanceof ValidationError || err instanceof DatabaseError) {
        setFormError(err.message);
      } else {
        setFormError('Terjadi kendala saat mengirimkan ucapan. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invitation.showWishes === false) {
    return null;
  }

  return (
    <section
      aria-labelledby="section-wishes-heading"
      className="py-16 sm:py-24 px-6 max-w-xl mx-auto space-y-8 text-center"
    >
      <div className="space-y-3">
        <h2
          id="section-wishes-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Doa &amp; Ucapan
        </h2>

        <p className="text-xs sm:text-sm text-[var(--theme-color-primary)]/80 leading-relaxed max-w-md mx-auto">
          Untaian doa dan pesan hangat dari kerabat serta sahabat tercinta.
        </p>
      </div>

      {/* Formulir Kirim Doa & Ucapan */}
      <div className="p-6 sm:p-7 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-left space-y-4 shadow-xs">
        <h3
          className="text-sm font-medium text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Kirimkan Doa Restu
        </h3>

        {formSuccess && (
          <div
            role="status"
            className="p-3 rounded text-xs border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center justify-between"
          >
            <span>Terima kasih, doa dan ucapan Anda telah berhasil dikirimkan.</span>
            <button
              type="button"
              onClick={() => setFormSuccess(false)}
              className="text-emerald-900 underline hover:no-underline text-[11px] ml-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="p-3 rounded text-xs border border-red-300 bg-red-50 text-red-700"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitWish} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label
              htmlFor="wish-guest-name"
              className="block font-semibold text-[var(--theme-color-primary)]"
            >
              Nama Anda <span className="text-red-500">*</span>
            </label>
            <input
              id="wish-guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
              required
              placeholder="Contoh: Keluarga Bpk. Pratama"
              className="w-full py-2 px-3 rounded border border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-color-primary)] transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block font-semibold text-[var(--theme-color-primary)]">
              Kepastian Kehadiran
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAttendance('attending')}
                disabled={isSubmitting}
                className={`py-1.5 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  attendance === 'attending'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => setAttendance('declined')}
                disabled={isSubmitting}
                className={`py-1.5 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  attendance === 'declined'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Tidak Hadir
              </button>
              <button
                type="button"
                onClick={() => setAttendance('tentative')}
                disabled={isSubmitting}
                className={`py-1.5 px-2 text-center rounded text-xs font-medium border transition-all cursor-pointer ${
                  attendance === 'tentative'
                    ? 'border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)]'
                    : 'border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)]/80 hover:bg-[var(--theme-color-primary)]/5'
                }`}
              >
                Masih Ragu
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="wish-content"
                className="block font-semibold text-[var(--theme-color-primary)]"
              >
                Ucapan &amp; Doa Restu <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[var(--theme-color-primary)]/60 font-mono">
                {wishText.length}/500
              </span>
            </div>
            <textarea
              id="wish-content"
              rows={3}
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
              required
              placeholder="Tuliskan ucapan selamat dan doa tulus untuk kedua mempelai..."
              className="w-full py-2 px-3 rounded border border-[var(--theme-color-border)] bg-transparent text-[var(--theme-color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-color-primary)] transition-all resize-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded font-semibold tracking-wide border border-[var(--theme-color-primary)] bg-[var(--theme-color-primary)] text-[var(--theme-color-surface)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 text-center"
          >
            {isSubmitting ? 'Mengirimkan doa & ucapan...' : 'Kirim Ucapan'}
          </button>
        </form>
      </div>

      {/* Daftar Doa & Ucapan */}
      <div className="space-y-4">
        <h3
          className="text-sm font-medium text-[var(--theme-color-primary)] text-left"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Untaian Doa ({wishesList.length})
        </h3>

        {loading ? (
          <div className="p-8 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/60">
            Memuat ucapan...
          </div>
        ) : error ? (
          <div className="p-6 border border-red-200 rounded bg-red-50 text-xs text-red-700 space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadWishes}
              className="text-xs font-semibold text-red-800 underline hover:no-underline cursor-pointer"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : wishesList.length === 0 ? (
          <div className="p-8 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-xs text-[var(--theme-color-primary)]/70 leading-relaxed">
            Belum ada ucapan yang masuk. Jadilah yang pertama memberikan doa restu untuk kedua mempelai!
          </div>
        ) : (
          <div className="space-y-3 text-left">
            {wishesList.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-color-border)]/50 pb-2">
                  <span className="text-xs font-semibold text-[var(--theme-color-primary)]">
                    {item.guest_name}
                  </span>
                  <span className="text-[10px] text-[var(--theme-color-primary)]/50 font-mono">
                    {formatWishDate(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed whitespace-pre-wrap">
                  {item.wishes}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
