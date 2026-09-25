import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  getPublicInvitationBySlug,
  extractInvitationContent,
  type PublicInvitationPayload,
} from '@/lib/invitations';
import { getGuestBySlug, type GuestItem } from '@/lib/guests';
import { InvitationRenderer } from '@/components/template';
import { DatabaseError } from '@/lib/errors';

/**
 * Halaman Publik Undangan (/i/:slug):
 * Halaman tanpa proteksi sesi untuk pengunjung/tamu.
 * Hanya memuat undangan yang berstatus 'published'.
 * Mendukung tautan personal tamu (/i/:slug?to=:guest_slug).
 * Menggunakan InvitationRenderer untuk merender tema dan seksi secara responsif.
 */
export function PublicInvitation() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const guestSlugParam = searchParams.get('to');

  const [invitation, setInvitation] = useState<PublicInvitationPayload | null>(null);
  const [guest, setGuest] = useState<GuestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!slug) {
      setError('Tautan undangan tidak valid.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getPublicInvitationBySlug(slug)
      .then(async (data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Undangan tidak ditemukan atau belum dipublikasikan.');
        } else {
          setInvitation(data);

          // Jika ada parameter ?to=:guest_slug, cari data tamu secara aman
          if (guestSlugParam) {
            try {
              const guestData = await getGuestBySlug(data.id, guestSlugParam);
              if (isMounted) {
                setGuest(guestData);
              }
            } catch {
              // Jika slug tidak ditemukan atau ada kendala, tampilkan sebagai pengunjung umum tanpa crash
              if (isMounted) {
                setGuest(null);
              }
            }
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof DatabaseError) {
          setError('Terjadi kendala saat memuat undangan. Silakan coba kembali nanti.');
        } else {
          setError('Terjadi kesalahan yang tidak terduga saat memuat undangan.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, guestSlugParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <p className="text-xs text-text-muted font-medium" role="status">
          Memuat undangan...
        </p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-surface border border-border rounded p-8 shadow-sm text-center space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-subtle text-sm font-semibold">
            404
          </div>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Undangan Tidak Ditemukan
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {error ?? 'Undangan yang Anda tuju belum dipublikasikan atau tautan yang dimasukkan tidak tepat.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-block py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors"
            >
              Kembali ke Beranda Aurovia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InvitationRenderer
      invitation={invitation}
      template={invitation.template}
      customSections={invitation.sections}
      content={extractInvitationContent(invitation.data)}
      events={invitation.events}
      gallery={invitation.gallery}
      guest={guest}
    />
  );
}
