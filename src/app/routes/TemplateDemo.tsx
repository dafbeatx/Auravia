import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTemplateBySlug, type TemplateDetail } from '@/lib/templates';
import { getTemplateDefinition } from '@/lib/template/definitions';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';
import type { InvitationContent } from '@/lib/template/types';

function getCategoryBadge(slug: string, rawCategory?: string): string {
  switch (slug) {
    case 'royal-navy-gold':
      return 'Royal / Luxury';
    case 'botanical-garden':
      return 'Floral / Botanical';
    case 'modern-minimal':
      return 'Modern / Contemporary';
    case 'classic-elegance':
    default:
      return rawCategory && rawCategory !== 'wedding' ? rawCategory : 'Classic / Editorial';
  }
}

function createDemoPhotoSvg(
  title: string,
  subtitle: string,
  bgStart: string,
  bgEnd: string,
  accent: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="600" height="750" fill="url(#bg)" />
    <rect x="24" y="24" width="552" height="702" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.35" rx="16" />
    <circle cx="300" cy="310" r="100" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="300" cy="310" r="85" fill="${accent}" fill-opacity="0.08" />
    <path d="M265,310 C265,280 300,260 300,310 C300,260 335,280 335,310 C335,340 300,365 300,375 C300,365 265,340 265,310 Z" fill="${accent}" fill-opacity="0.75" />
    <text x="300" y="480" font-family="serif" font-size="26" font-weight="600" fill="${accent}" text-anchor="middle" letter-spacing="1.5">${title}</text>
    <text x="300" y="520" font-family="sans-serif" font-size="13" fill="${accent}" fill-opacity="0.8" text-anchor="middle" letter-spacing="2">${subtitle}</text>
    <text x="300" y="565" font-family="serif" font-size="16" font-style="italic" fill="${accent}" fill-opacity="0.6" text-anchor="middle">Raka &amp; Aulia</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Halaman Demo Template (/templates/:slug/demo):
 * Menampilkan pratinjau interaktif sesungguhnya dari template undangan menggunakan InvitationRenderer.
 * Dilengkapi sticky top bar bernuansa Aurovia dan data representatif natural.
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

  // Muat detail template dari database atau fallback ke definisi kode
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

  // Bangun galeri foto demo SVG yang selaras dengan palet tema template
  const demoGallery = useMemo(() => {
    let bgStart = '#FAF9F6';
    let bgEnd = '#E7E5E0';
    let accent = '#292524';

    if (slug === 'royal-navy-gold') {
      bgStart = '#0A1324';
      bgEnd = '#1E3A5F';
      accent = '#D4AF37';
    } else if (slug === 'botanical-garden') {
      bgStart = '#F4F6F0';
      bgEnd = '#D3DDD3';
      accent = '#2D4F3F';
    } else if (slug === 'modern-minimal') {
      bgStart = '#F8F9FA';
      bgEnd = '#E2E8F0';
      accent = '#006A71';
    }

    return [
      {
        id: 'photo-1',
        storage_path: createDemoPhotoSvg('Senyuman Pembuka Cerita', 'Momen Awal Pertemuan', bgStart, bgEnd, accent),
        thumbnail_path: null,
        caption: 'Kisah yang bermula dari senyuman hangat penuh ketulusan.',
        display_order: 0,
        width: 600,
        height: 750,
      },
      {
        id: 'photo-2',
        storage_path: createDemoPhotoSvg('Langkah Menuju Bahagia', 'Janji Kebersamaan', bgStart, bgEnd, accent),
        thumbnail_path: null,
        caption: 'Saling beriringan merangkai impian dan cita masa depan.',
        display_order: 1,
        width: 600,
        height: 750,
      },
      {
        id: 'photo-3',
        storage_path: createDemoPhotoSvg('Dua Hati Satu Tujuan', 'Ikatan Suci', bgStart, bgEnd, accent),
        thumbnail_path: null,
        caption: 'Memantapkan niat suci dalam balutan kasih dan keteguhan doa.',
        display_order: 2,
        width: 600,
        height: 750,
      },
      {
        id: 'photo-4',
        storage_path: createDemoPhotoSvg('Potret Menatap Masa Depan', 'Hari Yang Dinanti', bgStart, bgEnd, accent),
        thumbnail_path: null,
        caption: 'Menyongsong lembaran baru dengan penuh rasa syukur.',
        display_order: 3,
        width: 600,
        height: 750,
      },
    ];
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
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-4">
          <h1 className="font-serif text-2xl text-text-primary font-bold">
            Template Tidak Ditemukan
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Template dengan pengenal &ldquo;{slug}&rdquo; tidak terdaftar dalam katalog Aurovia.
          </p>
          <div className="pt-2">
            <Link
              to="/#template"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary-hover transition-colors text-sm shadow-xs"
            >
              Kembali ke Template
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Data representatif natural untuk pengalaman demo undangan yang sesungguhnya
  const demoInvitation = {
    id: `demo-${template.slug}`,
    title: `Pernikahan Raka & Aulia (${template.name})`,
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
      eyebrow: 'THE WEDDING OF',
      title: 'Raka & Aulia',
      subtitle: 'Sabtu, 24 Oktober 2026 • Grand Ballroom Hotel Aryaduta Bandung',
      button_label: 'Buka Undangan',
    },
    hero: {
      headline: 'Walimatul Ursy',
      couple_names: 'Raka & Aulia',
      opening_text: 'Sabtu, 24 Oktober 2026',
      location_short: 'Grand Ballroom Hotel Aryaduta, Bandung',
    },
    quote: {
      enabled: true,
      arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
      translation: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
      source: 'QS. Ar-Rum: 21',
    },
    hosts: [
      {
        id: 'groom',
        name: 'Raka Pratama, S.T.',
        role: 'Mempelai Pria',
        parents: 'Putra pertama dari Bpk. Ir. H. Hendra Pratama & Ibu Hj. Ratna Juwita',
        bio: 'Putra pertama yang berdedikasi dan penuh kehangatan dalam membina keluarga.',
      },
      {
        id: 'bride',
        name: 'Aulia Nurfadilah, S.Farm.',
        role: 'Mempelai Wanita',
        parents: 'Putri bungsu dari Bpk. Drs. H. Achmad Fauzan & Ibu Hj. Dewi Sartika',
        bio: 'Putri bungsu yang santun dan gemar menebarkan keceriaan bagi orang-orang terdekat.',
      },
    ],
    story: [
      {
        id: 'story-1',
        title: 'Awal Pertemuan',
        date: '2021',
        description: 'Pertama kali bertukar sapa di ruang seminar kampus, mengawali obrolan hangat tentang karya dan cita-cita masa depan.',
        display_order: 0,
        is_enabled: true,
      },
      {
        id: 'story-2',
        title: 'Komitmen Bersama',
        date: '2024',
        description: 'Dengan restu penuh kedua keluarga besar, kami membulatkan niat untuk melangkah bersama dalam ikatan suci yang penuh berkah.',
        display_order: 1,
        is_enabled: true,
      },
      {
        id: 'story-3',
        title: 'Menuju Hari Bahagia',
        date: '2026',
        description: 'Mempersiapkan hari istimewa kami dengan rasa syukur mendalam, menyambut keluarga dan sahabat tercinta.',
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
          account_number: '7820194821',
          holder_name: 'Raka Pratama',
          display_order: 0,
          is_enabled: true,
        },
        {
          id: 'acc-2',
          type: 'bank',
          provider: 'Bank Mandiri',
          account_number: '1310029482012',
          holder_name: 'Aulia Nurfadilah',
          display_order: 1,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: 'Raka & Aulia',
        address: 'Jl. Riau No. 45, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115',
        is_enabled: true,
      },
    },
    closing_notes: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi lembaran baru kehidupan kami.',
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

  const handleUseTemplate = () => {
    navigate(`/dashboard/invitations/new?templateId=${encodeURIComponent(template.id || template.slug)}`);
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary selection:bg-accent-light/40 antialiased font-sans flex flex-col">
      {/* Sticky Demo Top Bar (Aurovia Global Design System) */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Sisi Kiri: Tombol Kembali ke Template */}
          <div className="flex items-center min-w-0">
            <Link
              to="/#template"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2.5 py-2 min-h-[44px] cursor-pointer"
              aria-label="Kembali ke Katalog Template"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Kembali ke Template</span>
              <span className="sm:hidden">Template</span>
            </Link>
          </div>

          {/* Bagian Tengah: Nama Template & Badge Kategori */}
          <div className="flex items-center justify-center gap-2 min-w-0 text-center">
            <span className="font-serif text-sm sm:text-base font-bold text-text-primary truncate">
              {template.name}
            </span>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-secondary/15 text-primary border border-secondary/30 whitespace-nowrap">
              {getCategoryBadge(template.slug, template.category)}
            </span>
          </div>

          {/* Sisi Kanan: CTA Gunakan Template Ini */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleUseTemplate}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full text-xs sm:text-sm transition-all shadow-xs active:scale-95 whitespace-nowrap min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Gunakan Template Ini
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Invitation Experience (Merender Tema Template Asli) */}
      <main className="w-full flex-1">
        <InvitationRenderer
          invitation={demoInvitation}
          template={template}
          content={demoContent}
          events={demoEvents}
          gallery={demoGallery}
          guest={{
            id: 'demo-guest',
            name: 'Bapak/Ibu/Saudara/i',
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
