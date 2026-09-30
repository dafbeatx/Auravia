import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTemplateBySlug, type TemplateDetail } from '@/lib/templates';
import { getTemplateDefinition } from '@/lib/template/definitions';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';
import type { InvitationContent } from '@/lib/template/types';
import { trackDemoView } from '@/lib/analytics';
import { getTemplateDemoData, type TemplateDemoData } from '@/lib/admin';
import { getTemplateDemoDefaults } from '@/lib/templateDemoDefaults';

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

  // Data representatif otentik bawaan tiap template
  const defaults = useMemo(() => {
    return getTemplateDemoDefaults(slug || 'classic-elegance');
  }, [slug]);

  // Bangun galeri foto demo dari data admin atau bawaan aset template
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

    return defaults.gallery.map((item, idx) => ({
      id: item.id || `photo-${idx + 1}`,
      storage_path: item.image_url,
      thumbnail_path: null,
      caption: item.caption,
      display_order: item.display_order,
      width: 600,
      height: 750,
    }));
  }, [demoData, defaults]);

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
  const heroConfig = (demoData?.hero || {}) as Record<string, unknown>;
  const coupleConfig = (demoData?.couple || {}) as Record<string, unknown>;
  const quoteConfig = (demoData?.quote || {}) as Record<string, unknown>;
  const giftConfig = (demoData?.gift || {}) as Record<string, unknown>;
  const closingConfig = (demoData?.closing || {}) as Record<string, unknown>;

  const coupleNames =
    (heroConfig.couple_names as string) ||
    defaults.hero.couple_names;

  // Data representatif natural untuk pengalaman demo undangan yang sesungguhnya
  const demoInvitation = {
    id: `demo-${template.slug}`,
    title: `Pernikahan ${coupleNames} (${template.name})`,
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
      title: coupleNames,
      subtitle: `${(heroConfig.opening_text as string) || defaults.hero.opening_text} • ${(heroConfig.location as string) || defaults.hero.location}`,
      button_label: 'Buka Undangan',
      background_image_url:
        (heroConfig.cover_image as string) ||
        (heroConfig.background_image as string) ||
        defaults.hero.cover_image,
    },
    hero: {
      headline: (heroConfig.headline as string) || defaults.hero.headline,
      couple_names: coupleNames,
      opening_text: (heroConfig.opening_text as string) || defaults.hero.opening_text,
      location_short: (heroConfig.location as string) || defaults.hero.location,
    },
    quote: {
      enabled: quoteConfig.enabled !== false,
      arabic: (quoteConfig.arabic as string) || defaults.quote.arabic,
      translation: (quoteConfig.quote_text as string) || (quoteConfig.translation as string) || defaults.quote.quote_text,
      source: (quoteConfig.source as string) || defaults.quote.source,
    },
    hosts: [
      {
        id: 'groom',
        name: (coupleConfig.groom_name as string) || defaults.couple.groom_name,
        role: 'Mempelai Pria',
        parents: (coupleConfig.groom_parents as string) || defaults.couple.groom_parents,
        bio: (coupleConfig.groom_bio as string) || defaults.couple.groom_bio,
        photo_url: (coupleConfig.groom_photo as string) || defaults.couple.groom_photo,
      },
      {
        id: 'bride',
        name: (coupleConfig.bride_name as string) || defaults.couple.bride_name,
        role: 'Mempelai Wanita',
        parents: (coupleConfig.bride_parents as string) || defaults.couple.bride_parents,
        bio: (coupleConfig.bride_bio as string) || defaults.couple.bride_bio,
        photo_url: (coupleConfig.bride_photo as string) || defaults.couple.bride_photo,
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
      : defaults.story,
    gift: {
      is_enabled: giftConfig.enabled !== false,
      accounts: Array.isArray(giftConfig.accounts) && giftConfig.accounts.length > 0
        ? (giftConfig.accounts as Array<Record<string, unknown>>).map((a, idx) => ({
            id: (a.id as string) || `acc-${idx + 1}`,
            type: (a.type === 'ewallet' ? 'ewallet' : 'bank') as 'bank' | 'ewallet',
            provider: (a.provider as string) || 'Bank Central Asia (BCA)',
            account_number: (a.account_number as string) || '',
            holder_name: (a.holder_name as string) || (a.account_name as string) || coupleNames,
            display_order: idx,
            is_enabled: a.is_enabled !== false,
          }))
        : defaults.gift.accounts,
      physical_address: {
        recipient_name: ((giftConfig.physical_address as Record<string, unknown>)?.recipient_name as string) || coupleNames,
        address: ((giftConfig.physical_address as Record<string, unknown>)?.address as string) || defaults.gift.physical_address.address,
        is_enabled: true,
      },
    },
    closing_notes: (closingConfig.closing_message as string) || defaults.closing.closing_message,
  };

  const demoEvents = (demoData?.events && Array.isArray(demoData.events) && demoData.events.length > 0)
    ? (demoData.events as Array<Record<string, unknown>>).map((ev, idx) => ({
        id: (ev.id as string) || `demo-event-${idx + 1}`,
        title: (ev.title as string) || 'Acara',
        start_time: ev.date && ev.time ? `${ev.date}T${ev.time}:00+07:00` : (ev.date ? `${ev.date}T08:00:00+07:00` : '2026-10-24T08:00:00+07:00'),
        end_time: null,
        timezone: 'WIB',
        venue_name: (ev.venue as string) || (ev.venue_name as string) || '',
        address: (ev.address as string) || null,
        maps_url: (ev.maps_url as string) || null,
        is_primary: idx === 1 || !!ev.is_primary,
      }))
    : defaults.events.map((ev, idx) => ({
        id: ev.id,
        title: ev.title,
        start_time: `${ev.date}T${ev.start_time}:00+07:00`,
        end_time: ev.end_time ? `${ev.date}T${ev.end_time}:00+07:00` : null,
        timezone: ev.timezone,
        venue_name: ev.venue_name,
        address: ev.address,
        maps_url: ev.maps_url,
        is_primary: ev.is_primary ?? idx === 1,
      }));

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
