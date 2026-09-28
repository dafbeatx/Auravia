import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTemplateBySlug, type TemplateDetail } from '@/lib/templates';
import { getTemplateDefinition } from '@/lib/template/definitions';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';
import type { InvitationContent } from '@/lib/template/types';
import { trackDemoView } from '@/lib/analytics';
import { getTemplateDemoData, type TemplateDemoData } from '@/lib/admin';

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
 * Dilengkapi sticky top bar bernuansa Aurovia dan data representatif natural yang dikelola admin.
 */
export function TemplateDemo() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [demoData, setDemoData] = useState<TemplateDemoData | null>(null);
  const [loading, setLoading] = useState(true);

  // Jika pengunjung belum login, arahkan ke login dan simpan URL tujuan demo
  useEffect(() => {
    if (!authLoading && !user) {
      const redirectTarget = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
    }
  }, [user, authLoading, location, navigate]);

  // Muat detail template dan konfigurasi data demo dari admin
  useEffect(() => {
    let isMounted = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getTemplateBySlug(slug).catch(() => null),
      getTemplateDemoData(slug).catch(() => null),
    ])
      .then(([tplData, customDemo]) => {
        if (!isMounted) return;
        if (tplData) {
          setTemplate(tplData);
        } else {
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
            status: 'active',
            display_order: 0,
            is_featured: false,
            preview_desktop_path: null,
            preview_mobile_path: null,
            preview_thumbnail_path: null,
          });
        }
        if (customDemo) {
          setDemoData(customDemo);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Catat event analytics demo template view secara efisien
  useEffect(() => {
    if (template?.id && template?.slug) {
      trackDemoView(template.id, template.slug, user?.id);
    }
  }, [template?.id, template?.slug, user?.id]);

  // Bangun galeri foto demo dari data admin atau fallback SVG yang selaras dengan palet tema template
  const demoGallery = useMemo(() => {
    if (demoData?.gallery && Array.isArray(demoData.gallery) && demoData.gallery.length > 0) {
      return (demoData.gallery as Array<Record<string, unknown>>).map((item, idx) => ({
        id: (item.id as string) || `photo-${idx + 1}`,
        storage_path: (item.image_url as string) || (item.storage_path as string) || '',
        thumbnail_path: null,
        caption: (item.caption as string) || null,
        display_order: typeof item.display_order === 'number' ? item.display_order : idx,
        width: 600,
        height: 750,
      }));
    }

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
  }, [slug, demoData]);

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

  const rsvpConfig = (demoData?.rsvp || {}) as Record<string, unknown>;
  const wishesConfig = (demoData?.wishes || {}) as Record<string, unknown>;

  // Data representatif natural untuk pengalaman demo undangan yang sesungguhnya
  const demoInvitation = {
    id: `demo-${template.slug}`,
    title: `Pernikahan ${((demoData?.hero || {}) as Record<string, unknown>).couple_names || 'Raka & Aulia'} (${template.name})`,
    slug: template.slug,
    event_type: 'wedding',
    eventType: 'wedding',
    status: 'published',
    allow_rsvp: rsvpConfig.enabled !== false,
    allowRsvp: rsvpConfig.enabled !== false,
    show_wishes: wishesConfig.enabled !== false,
    showWishes: wishesConfig.enabled !== false,
    theme_override: null,
    themeOverride: null,
  };

  const demoContent: InvitationContent = {
    cover: {
      enabled: true,
      eyebrow: 'THE WEDDING OF',
      title: (((demoData?.hero || {}) as Record<string, unknown>).couple_names as string) || 'Raka & Aulia',
      subtitle: `${(((demoData?.hero || {}) as Record<string, unknown>).opening_text as string) || 'Sabtu, 24 Oktober 2026'} • ${(((demoData?.hero || {}) as Record<string, unknown>).location as string) || 'Grand Ballroom Hotel Aryaduta Bandung'}`,
      button_label: 'Buka Undangan',
      background_image_url:
        (((demoData?.hero || {}) as Record<string, unknown>).cover_image as string) ||
        (((demoData?.hero || {}) as Record<string, unknown>).background_image as string) ||
        undefined,
    },
    hero: {
      headline: (((demoData?.hero || {}) as Record<string, unknown>).headline as string) || 'Walimatul Ursy',
      couple_names: (((demoData?.hero || {}) as Record<string, unknown>).couple_names as string) || 'Raka & Aulia',
      opening_text: (((demoData?.hero || {}) as Record<string, unknown>).opening_text as string) || 'Sabtu, 24 Oktober 2026',
      location_short: (((demoData?.hero || {}) as Record<string, unknown>).location as string) || 'Grand Ballroom Hotel Aryaduta, Bandung',
    },
    quote: {
      enabled: ((demoData?.quote || {}) as Record<string, unknown>).enabled !== false,
      arabic: (((demoData?.quote || {}) as Record<string, unknown>).arabic as string) || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
      translation: (((demoData?.quote || {}) as Record<string, unknown>).quote_text as string) || 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
      source: (((demoData?.quote || {}) as Record<string, unknown>).source as string) || 'QS. Ar-Rum: 21',
    },
    hosts: [
      {
        id: 'groom',
        name: (((demoData?.couple || {}) as Record<string, unknown>).groom_name as string) || 'Raka Pratama, S.T.',
        role: 'Mempelai Pria',
        parents: (((demoData?.couple || {}) as Record<string, unknown>).groom_parents as string) || 'Putra pertama dari Bpk. Ir. H. Hendra Pratama & Ibu Hj. Ratna Juwita',
        bio: (((demoData?.couple || {}) as Record<string, unknown>).groom_bio as string) || 'Putra pertama yang berdedikasi dan penuh kehangatan dalam membina keluarga.',
        photo_url: (((demoData?.couple || {}) as Record<string, unknown>).groom_photo as string) || undefined,
      },
      {
        id: 'bride',
        name: (((demoData?.couple || {}) as Record<string, unknown>).bride_name as string) || 'Aulia Nurfadilah, S.Farm.',
        role: 'Mempelai Wanita',
        parents: (((demoData?.couple || {}) as Record<string, unknown>).bride_parents as string) || 'Putri bungsu dari Bpk. Drs. H. Achmad Fauzan & Ibu Hj. Dewi Sartika',
        bio: (((demoData?.couple || {}) as Record<string, unknown>).bride_bio as string) || 'Putri bungsu yang santun dan gemar menebarkan keceriaan bagi orang-orang terdekat.',
        photo_url: (((demoData?.couple || {}) as Record<string, unknown>).bride_photo as string) || undefined,
      },
    ],
    story: (demoData?.story && Array.isArray(demoData.story) && demoData.story.length > 0)
      ? (demoData.story as Array<Record<string, unknown>>).map((item, idx) => ({
          id: (item.id as string) || `story-${idx + 1}`,
          title: (item.title as string) || '',
          date: (item.year_date as string) || (item.date as string) || '',
          description: (item.description as string) || '',
          display_order: typeof item.display_order === 'number' ? item.display_order : idx,
          is_enabled: item.is_enabled !== false,
        }))
      : [
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
      is_enabled: ((demoData?.gift || {}) as Record<string, unknown>).enabled !== false,
      accounts: [
        {
          id: 'acc-1',
          type: 'bank',
          provider: (((demoData?.gift || {}) as Record<string, unknown>).bank as string) || 'Bank Central Asia (BCA)',
          account_number: (((demoData?.gift || {}) as Record<string, unknown>).account_number as string) || '7820194821',
          holder_name: (((demoData?.gift || {}) as Record<string, unknown>).account_name as string) || 'Raka Pratama',
          display_order: 0,
          is_enabled: true,
        },
      ],
      physical_address: {
        recipient_name: (((demoData?.hero || {}) as Record<string, unknown>).couple_names as string) || 'Raka & Aulia',
        address: (((demoData?.hero || {}) as Record<string, unknown>).location as string) || 'Jl. Riau No. 45, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115',
        is_enabled: true,
      },
    },
    closing_notes: (((demoData?.closing || {}) as Record<string, unknown>).closing_message as string) || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi lembaran baru kehidupan kami.',
  };

  const demoEvents = (demoData?.events && Array.isArray(demoData.events) && demoData.events.length > 0)
    ? (demoData.events as Array<Record<string, unknown>>).map((ev, idx) => ({
        id: (ev.id as string) || `demo-event-${idx + 1}`,
        title: (ev.title as string) || 'Acara',
        start_time: ev.date && ev.time ? `${ev.date}T${ev.time}:00+07:00` : (ev.date ? `${ev.date}T08:00:00+07:00` : '2026-10-24T08:00:00+07:00'),
        end_time: null,
        timezone: 'WIB',
        venue_name: (ev.venue as string) || '',
        address: (ev.address as string) || null,
        maps_url: (ev.maps_url as string) || null,
        is_primary: idx === 1 || !!ev.is_primary,
      }))
    : [
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
