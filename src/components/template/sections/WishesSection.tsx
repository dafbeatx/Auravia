import React, { useEffect, useState, useCallback } from 'react';
import type { SectionRendererProps } from '@/lib/template/types';
import { getPublicWishes, type PublicRsvpWish } from '@/lib/rsvps';

function formatWishDate(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const WishesSection: React.FC<SectionRendererProps> = ({ invitation }) => {
  const [wishesList, setWishesList] = useState<PublicRsvpWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </section>
  );
};
