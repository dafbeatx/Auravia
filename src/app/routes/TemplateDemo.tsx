import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTemplateBySlug, type TemplateDetail } from '@/lib/templates';
import { getTemplateDefinition } from '@/lib/template/definitions';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';
import type { InvitationContent } from '@/lib/template/types';

/**
 * Halaman Demo Template (/templates/:slug/demo):
 * Menampilkan pratinjau interaktif sesungguhnya dari template undangan menggunakan InvitationRenderer.
 * Akses dilindungi: Pengunjung yang belum terautentikasi dialihkan ke /login dengan parameter redirect yang aman.
 */
export function TemplateDemo() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Jika pengunjung belum login, arahkan ke login dan simpan URL tujuan demo
  useEffect(() => {
    if (!authLoading && !user) {
      const redirectTarget = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
    }
  }, [user, authLoading, location, navigate]);

  // Muat detail template
  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getTemplateBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        setTemplate(data);
      })
      .catch(() => {
        if (!isMounted) return;
        const definition = getTemplateDefinition(slug);
        setTemplate({
          id: definition.id,
          slug: definition.slug,
          name: definition.name,
          category: definition.category,
          description: definition.description,
          thumbnail_url: definition.identity?.thumbnailUrl || '',
          default_theme: definition.defaultTheme as unknown as import('@/types/database').Json,
          default_sections: definition.sections as unknown as import('@/types/database').Json,
          is_active: true,
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-text-muted" role="status">
          Menyiapkan demo template undangan...
        </p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 shadow-sm">
          <h1 className="font-serif text-2xl text-text font-bold mb-2">
            Template Tidak Ditemukan
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Template dengan pengenal &ldquo;{slug}&rdquo; tidak terdaftar dalam katalog Aurovia.
          </p>
          <Link
            to="/#template"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover transition-colors text-sm"
          >
            Kembali ke Katalog Template
          </Link>
        </div>
      </div>
    );
  }

  // Data tiruan realistis untuk demonstrasi interaktif
  const demoInvitation = {
    id: 'demo-invitation-id',
    title: `Pernikahan Rika & Dani (${template.name})`,
    slug: template.slug,
    event_type: 'wedding',
    eventType: 'wedding',
    status: 'published',
    allow_rsvp: true,
    allowRsvp: true,
    show_wishes: true,
    showWishes: true,
    theme_override: null,
    themeOverride: null,
  };

  const demoContent: InvitationContent = {
    cover: {
      enabled: true,
      title: 'Pernikahan Kami',
      subtitle: 'The Wedding Celebration',
    },
    hero: {
      headline: 'Walimatul Ursy',
      couple_names: 'Rika & Dani',
      opening_text: 'Sabtu, 24 Oktober 2026',
      location_short: 'Grand Ballroom Hotel Aryaduta, Bandung',
    },
    quote: {
      arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعELَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
      translation: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
      source: 'QS. Ar-Rum: 21',
    },
    hosts: [
      {
        id: 'groom',
        name: 'Raden Arya Dani Prasetya, S.T.',
        role: 'Mempelai Pria',
        parents: 'Putra dari Bpk. Bambang Prasetyo & Ibu Sri Wahyuni',
        bio: 'Putra pertama dari keluarga Bpk. Bambang Prasetyo dan Ibu Sri Wahyuni.',
      },
      {
        id: 'bride',
        name: 'Rika Nurul Aini, S.Farm.',
        role: 'Mempelai Wanita',
        parents: 'Putri dari Bpk. H. Ahmad Fauzi & Ibu Hj. Siti Aminah',
        bio: 'Putri bungsu dari keluarga Bpk. H. Ahmad Fauzi dan Ibu Hj. Siti Aminah.',
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Awal Pertemuan',
        date: '2021',
        description: 'Pertama kali bertukar sapa di ruang seminar kampus, mengawali obrolan hangat tentang cita-cita.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Komitmen Bersama',
        date: '2024',
        description: 'Dengan restu kedua orang tua, kami membulatkan niat melangkah menuju ikatan yang suci.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Menuju Hari Bahagia',
        date: '2026',
        description: 'Mempersiapkan lembaran baru kehidupan dalam naungan rahmat dan keberkahan.',
        display_order: 2,
        is_enabled: true,
      },
    ],
    gift: {
      is_enabled: true,
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: 'Bank Central Asia (BCA)',
          account_number: '1234567890',
          holder_name: 'Raden Arya Dani',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Mandiri',
          account_number: '0987654321',
          holder_name: 'Rika Nurul Aini',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Rika & Dani',
        address: 'Jl. Riau No. 45, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115',
        is_enabled: true,
      },
    },
    closing_notes: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
  };

  const demoEvents = [
    {
      id: 'demo-event-1',
      title: 'Akad Nikah',
      start_time: '2026-10-24T08:00:00+07:00',
      end_time: '2026-10-24T10:00:00+07:00',
      timezone: 'WIB',
      venue_name: 'Masjid Agung Al-Ukhuwah Bandung',
      address: 'Jl. Wastukencana No. 27, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
      maps_url: 'https://maps.google.com',
      is_primary: false,
    },
    {
      id: 'demo-event-2',
      title: 'Resepsi Pernikahan',
      start_time: '2026-10-24T11:00:00+07:00',
      end_time: '2026-10-24T14:00:00+07:00',
      timezone: 'WIB',
      venue_name: 'Grand Ballroom Hotel Aryaduta Bandung',
      address: 'Jl. Sumatera No. 51, Citarum, Kec. Bandung Wetan, Kota Bandung',
      maps_url: 'https://maps.google.com',
      is_primary: true,
    },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top Banner Navigation: Floating Controls for Demo Experience */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/#template"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            >
              <span>&larr;</span>
              <span className="hidden sm:inline">Katalog Template</span>
              <span className="sm:hidden">Katalog</span>
            </Link>
            <span className="text-border">|</span>
            <div className="truncate">
              <span className="text-xs font-semibold text-text uppercase tracking-wider block sm:inline">
                Demo:{' '}
              </span>
              <span className="text-xs sm:text-sm font-serif font-bold text-primary truncate">
                {template.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigate(`/dashboard/invitations/new?templateId=${encodeURIComponent(template.id || template.slug)}`);
              }}
              className="inline-flex items-center justify-center px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded text-xs sm:text-sm hover:bg-primary-hover transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Gunakan Template Ini
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Invitation Experience */}
      <main className="w-full">
        <InvitationRenderer
          invitation={demoInvitation}
          template={template}
          content={demoContent}
          events={demoEvents}
          guest={{
            id: 'demo-guest-id',
            name: (user?.email && user.email.split('@')[0]) || 'Sahabat & Kerabat',
            pax_limit: 2,
            slug: 'tamu-kehormatan',
          }}
          mode="public"
          previewCover={true}
        />
      </main>
    </div>
  );
}
