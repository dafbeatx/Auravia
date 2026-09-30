import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  getAdminTemplates,
  getTemplateDemoData,
  adminSaveTemplateDemo,
  uploadDemoMedia,
  getDemoMediaPublicUrl,
  type TemplateRow,
  type TemplateDemoData,
} from '@/lib/admin';
import { getTemplateDemoDefaults } from '@/lib/templateDemoDefaults';

interface StoryItem {
  id: string;
  title: string;
  year_date: string;
  description: string;
  image?: string;
  display_order: number;
  is_enabled: boolean;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  venue_name: string;
  address: string;
  maps_url: string;
  is_primary: boolean;
}

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
}

interface BankItem {
  id: string;
  type: string;
  provider: string;
  account_number: string;
  holder_name: string;
  is_enabled: boolean;
}

interface WishItem {
  id: string;
  sender_name: string;
  message: string;
  attendance_status: string;
  created_at: string;
}

type TabType =
  | 'hero'
  | 'couple'
  | 'story'
  | 'events'
  | 'gallery'
  | 'quote'
  | 'gift'
  | 'rsvp'
  | 'wishes'
  | 'closing'
  | 'theme';

export function AdminDemo() {
  const { templateId } = useParams<{ templateId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'hero'
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [heroData, setHeroData] = useState({
    headline: 'Walimatul Ursy',
    opening_text: 'Sabtu, 24 Oktober 2026',
    couple_names: 'Raka & Aulia',
    date: '2026-10-24',
    location: 'Grand Ballroom Hotel Aryaduta Bandung',
    background_image: '',
    cover_image: '',
  });

  const [coupleData, setCoupleData] = useState({
    groom_name: 'Raka Pratama, S.T.',
    groom_photo: '',
    groom_parents: 'Putra pertama dari Bpk. Ir. H. Hendra Pratama & Ibu Hj. Ratna Juwita',
    groom_bio: 'Putra pertama yang berdedikasi dan penuh kehangatan dalam membina keluarga.',
    bride_name: 'Aulia Nurfadilah, S.Farm.',
    bride_photo: '',
    bride_parents: 'Putri bungsu dari Bpk. Drs. H. Achmad Fauzan & Ibu Hj. Dewi Sartika',
    bride_bio: 'Putri bungsu yang santun dan gemar menebarkan keceriaan.',
    couple_photo: '',
  });

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [quoteData, setQuoteData] = useState({
    quote_text: '',
    source: '',
    arabic: '',
    is_enabled: true,
  });

  const [giftData, setGiftData] = useState<{
    is_enabled: boolean;
    accounts: BankItem[];
    physical_address: { recipient_name: string; address: string; is_enabled: boolean };
  }>({
    is_enabled: true,
    accounts: [],
    physical_address: { recipient_name: '', address: '', is_enabled: true },
  });

  const [rsvpData, setRsvpData] = useState({
    is_enabled: true,
    headline: 'Konfirmasi Kehadiran Tamu',
    description: 'Mohon konfirmasikan kehadiran Bapak/Ibu/Saudara/i untuk kenyamanan bersama.',
  });

  const [wishesData, setWishesData] = useState<{
    is_enabled: boolean;
    sample_wishes: WishItem[];
  }>({
    is_enabled: true,
    sample_wishes: [],
  });

  const [closingData, setClosingData] = useState({
    closing_message: 'Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
    image: '',
  });

  const [themeData, setThemeData] = useState({
    primary_color: '#006A71',
    secondary_color: '#48A6A7',
    background_color: '#F2EFE7',
    surface_color: '#FFFFFF',
    accent_color: '#D4AF37',
    heading_font: 'Playfair Display',
    body_font: 'Plus Jakarta Sans',
  });

  // Muat daftar template
  useEffect(() => {
    let isMounted = true;
    getAdminTemplates()
      .then((data) => {
        if (!isMounted) return;
        setTemplates(data);
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat daftar template.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync selected template from URL parameter
  useEffect(() => {
    if (!templates.length) return;

    if (templateId) {
      const match = templates.find((t) => t.id === templateId || t.slug === templateId);
      if (match) {
        setSelectedTemplate(match);
        loadDemoData(match);
      } else {
        setFeedback({
          type: 'error',
          message: `Template dengan ID "${templateId}" tidak ditemukan.`,
        });
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [templateId, templates]);

  // Sync tab with search params
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Muat data demo saat template dipilih
  const loadDemoData = async (tmpl: TemplateRow) => {
    try {
      setLoading(true);
      setFeedback(null);
      const defaults = getTemplateDemoDefaults(tmpl.slug);

      // Inisialisasi awal dengan template defaults
      setHeroData({
        headline: defaults.hero.headline,
        couple_names: defaults.hero.couple_names,
        opening_text: defaults.hero.opening_text,
        location: defaults.hero.location,
        date: defaults.hero.date,
        cover_image: defaults.hero.cover_image || '',
        background_image: defaults.hero.background_image || '',
      });

      setCoupleData({
        groom_name: defaults.couple.groom_name,
        groom_photo: defaults.couple.groom_photo || '',
        groom_parents: defaults.couple.groom_parents,
        groom_bio: defaults.couple.groom_bio,
        bride_name: defaults.couple.bride_name,
        bride_photo: defaults.couple.bride_photo || '',
        bride_parents: defaults.couple.bride_parents,
        bride_bio: defaults.couple.bride_bio,
        couple_photo: defaults.couple.couple_photo || '',
      });

      setStories(
        defaults.story.map((s, idx) => ({
          id: s.id,
          title: s.title,
          year_date: s.year_date,
          description: s.description,
          display_order: s.display_order ?? idx,
          is_enabled: s.is_enabled,
        }))
      );

      setEvents(
        defaults.events.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          start_time: e.start_time,
          end_time: e.end_time || '',
          timezone: e.timezone,
          venue_name: e.venue_name,
          address: e.address,
          maps_url: e.maps_url,
          is_primary: e.is_primary,
        }))
      );

      setGallery(
        defaults.gallery.map((g, idx) => ({
          id: g.id,
          image_url: g.image_url,
          caption: g.caption,
          display_order: g.display_order ?? idx,
        }))
      );

      setQuoteData({
        quote_text: defaults.quote.quote_text,
        source: defaults.quote.source,
        arabic: defaults.quote.arabic || '',
        is_enabled: defaults.quote.enabled,
      });

      setGiftData({
        is_enabled: defaults.gift.enabled,
        accounts: defaults.gift.accounts.map((a) => ({
          id: a.id,
          type: a.type,
          provider: a.provider,
          account_number: a.account_number,
          holder_name: a.holder_name,
          is_enabled: a.is_enabled,
        })),
        physical_address: {
          recipient_name: defaults.gift.physical_address.recipient_name,
          address: defaults.gift.physical_address.address,
          is_enabled: defaults.gift.physical_address.is_enabled,
        },
      });

      setRsvpData({
        is_enabled: defaults.rsvp.enabled,
        headline: defaults.rsvp.headline,
        description: defaults.rsvp.description,
      });

      setWishesData({
        is_enabled: defaults.wishes.enabled,
        sample_wishes: (defaults.wishes.sample_wishes || []).map((w, idx) => ({
          id: w.id || `wish-${idx + 1}`,
          sender_name: w.sender_name,
          message: w.message,
          attendance_status: w.attendance_status,
          created_at: w.created_at,
        })),
      });

      setClosingData({
        closing_message: defaults.closing.closing_message,
        image: defaults.closing.image || '',
      });

      // Template Theme Defaults
      if (tmpl.slug === 'royal-navy-gold') {
        setThemeData({
          primary_color: '#D4AF37',
          secondary_color: '#F6E09C',
          background_color: '#0A1324',
          surface_color: '#132238',
          accent_color: '#D4AF37',
          heading_font: 'Playfair Display',
          body_font: 'Plus Jakarta Sans',
        });
      } else if (tmpl.slug === 'botanical-garden') {
        setThemeData({
          primary_color: '#2D5A27',
          secondary_color: '#8BA888',
          background_color: '#F4F7F2',
          surface_color: '#FFFFFF',
          accent_color: '#4B7B47',
          heading_font: 'Cormorant Garamond',
          body_font: 'Plus Jakarta Sans',
        });
      } else if (tmpl.slug === 'modern-minimal') {
        setThemeData({
          primary_color: '#1A2E35',
          secondary_color: '#006A71',
          background_color: '#FAFAFA',
          surface_color: '#FFFFFF',
          accent_color: '#006A71',
          heading_font: 'Plus Jakarta Sans',
          body_font: 'Plus Jakarta Sans',
        });
      } else {
        setThemeData({
          primary_color: '#006A71',
          secondary_color: '#48A6A7',
          background_color: '#F2EFE7',
          surface_color: '#FFFFFF',
          accent_color: '#9ACBD0',
          heading_font: 'Playfair Display',
          body_font: 'Plus Jakarta Sans',
        });
      }

      // Ambil override dari database jika ada
      const remoteData = await getTemplateDemoData(tmpl.slug);
      if (remoteData) {
        if (remoteData.hero) setHeroData((prev) => ({ ...prev, ...(remoteData.hero as typeof prev) }));
        if (remoteData.couple) setCoupleData((prev) => ({ ...prev, ...(remoteData.couple as typeof prev) }));
        if (remoteData.story && Array.isArray(remoteData.story) && remoteData.story.length > 0) {
          setStories(remoteData.story as StoryItem[]);
        }
        if (remoteData.events && Array.isArray(remoteData.events) && remoteData.events.length > 0) {
          setEvents(remoteData.events as EventItem[]);
        }
        if (remoteData.gallery && Array.isArray(remoteData.gallery) && remoteData.gallery.length > 0) {
          setGallery(remoteData.gallery as GalleryItem[]);
        }
        if (remoteData.quote) setQuoteData((prev) => ({ ...prev, ...(remoteData.quote as typeof prev) }));
        if (remoteData.gift) setGiftData((prev) => ({ ...prev, ...(remoteData.gift as typeof prev) }));
        if (remoteData.rsvp) setRsvpData((prev) => ({ ...prev, ...(remoteData.rsvp as typeof prev) }));
        if (remoteData.wishes) {
          const wObj = remoteData.wishes as { is_enabled?: boolean; sample_wishes?: WishItem[] };
          setWishesData((prev) => ({
            is_enabled: wObj.is_enabled !== false,
            sample_wishes: Array.isArray(wObj.sample_wishes) ? wObj.sample_wishes : prev.sample_wishes,
          }));
        }
        if (remoteData.closing) setClosingData((prev) => ({ ...prev, ...(remoteData.closing as typeof prev) }));
      }
      setHasUnsavedChanges(false);
    } catch {
      // Fallback ke defaults
    } finally {
      setLoading(false);
    }
  };

  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Upload gambar demo (Section H validation & storage)
  const handleUploadImage = async (
    section: string,
    file: File,
    onSuccess: (url: string) => void
  ) => {
    if (!selectedTemplate) return;
    try {
      setSaving(true);
      const res = await uploadDemoMedia(selectedTemplate.id, section, file);
      onSuccess(res.publicUrl);
      markDirty();
      setFeedback({ type: 'success', message: 'Media demo berhasil diunggah ke storage.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah gambar.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload multiple images simultaneously
  const handleUploadMultipleImages = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTemplate) return;

    try {
      setSaving(true);
      const uploadedItems: GalleryItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const res = await uploadDemoMedia(selectedTemplate.id, 'gallery', file);
        uploadedItems.push({
          id: `gal-${Date.now()}-${i}`,
          image_url: res.publicUrl,
          caption: `Momen galeri ${selectedTemplate.name}`,
          display_order: gallery.length + i,
        });
      }

      setGallery((prev) => [...prev, ...uploadedItems]);
      markDirty();
      setFeedback({
        type: 'success',
        message: `Berhasil mengunggah ${uploadedItems.length} foto ke galeri demo.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah foto.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Simpan data demo ke database (JANGAN autosave)
  const handleSaveAll = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      setFeedback(null);

      const payload: Partial<TemplateDemoData> = {
        hero: heroData,
        couple: coupleData,
        story: stories,
        events: events,
        gallery: gallery,
        quote: quoteData,
        gift: giftData,
        rsvp: rsvpData,
        wishes: wishesData,
        closing: closingData,
      };

      await adminSaveTemplateDemo(selectedTemplate.id, payload);
      setHasUnsavedChanges(false);
      setFeedback({
        type: 'success',
        message: `Data demo untuk template "${selectedTemplate.name}" berhasil disimpan.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan data demo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedTemplate) {
      loadDemoData(selectedTemplate);
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Terdapat perubahan yang belum disimpan. Yakin ingin kembali ke daftar template?'
      );
      if (!confirmLeave) return;
    }
    navigate('/admin/demo');
  };

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'hero', label: '1. Hero / Cover' },
    { id: 'couple', label: '2. Couple' },
    { id: 'story', label: '3. Story' },
    { id: 'events', label: '4. Event' },
    { id: 'gallery', label: '5. Gallery' },
    { id: 'quote', label: '6. Quote' },
    { id: 'gift', label: '7. Gift' },
    { id: 'rsvp', label: '8. RSVP' },
    { id: 'wishes', label: '9. Wishes' },
    { id: 'closing', label: '10. Closing' },
    { id: 'theme', label: '11. Theme / Visual' },
  ];

  // =========================================================================
  // VIEW A: CATALOG LIST VIEW (/admin/demo without templateId)
  // =========================================================================
  if (!templateId) {
    return (
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">
              Demo Templates
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Kelola konten foto, data mempelai, cerita, acara, dan media demo publik untuk setiap template.
            </p>
          </div>
        </div>

        {loading && (
          <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3 text-xs text-text-muted">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Memuat katalog template demo...</span>
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:underline ml-4"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Template Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {templates.map((tmpl) => {
            const defaults = getTemplateDemoDefaults(tmpl.slug);
            const coverPreview = defaults.hero.cover_image || tmpl.thumbnail_url || '/images/demo/classic-elegance/cover.jpg';
            const mediaCount = defaults.gallery.length + 4; // gallery + cover + groom + bride + closing

            return (
              <div
                key={tmpl.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-4/3 overflow-hidden bg-surface-elevated">
                  <img
                    src={coverPreview}
                    alt={tmpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                      {tmpl.category || 'Wedding'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tmpl.is_active
                          ? 'bg-success/90 text-white'
                          : 'bg-text-muted/80 text-white'
                      }`}
                    >
                      {tmpl.is_active ? 'Aktif' : 'Draft'}
                    </span>
                  </div>

                  {/* Media Count Badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{mediaCount} Media</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                      {tmpl.name}
                    </h3>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">
                      slug: {tmpl.slug}
                    </p>
                    <p className="text-xs text-text-muted mt-2 line-clamp-2">
                      {tmpl.description || defaults.quote.quote_text}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-border flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/admin/demo/${tmpl.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all min-h-[40px] text-center"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Demo</span>
                      </Link>

                      <a
                        href={`/templates/${tmpl.slug}/demo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-border text-text-primary text-xs font-semibold transition-all min-h-[40px] text-center"
                      >
                        <span>Preview</span>
                        <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <Link
                      to={`/admin/demo/${tmpl.id}?tab=gallery`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-surface-elevated text-text-secondary text-xs font-semibold transition-all min-h-[36px]"
                    >
                      <svg className="w-3.5 h-3.5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Manage Media ({defaults.gallery.length} Foto)</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: 11-TAB DEMO EDITOR (/admin/demo/:templateId)
  // =========================================================================
  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb Navigation & Template Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-1 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Daftar Demo</span>
          </button>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Editor Demo: {selectedTemplate?.name || 'Template'}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Kustomisasi data demo, foto, kutipan, dan pengaturan tema visual untuk presentasi publik.
          </p>
        </div>

        {/* Template Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="demo-template-select" className="text-xs font-semibold text-text-muted whitespace-nowrap">
            Ganti Template:
          </label>
          <select
            id="demo-template-select"
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              if (hasUnsavedChanges) {
                const ok = window.confirm('Ada perubahan yang belum disimpan. Yakin ingin berganti template?');
                if (!ok) return;
              }
              navigate(`/admin/demo/${e.target.value}`);
            }}
            className="px-3.5 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center gap-2.5 text-xs text-text-muted">
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Memuat data konten template demo...</span>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-success/10 border border-success/30 text-success'
              : 'bg-danger/10 border border-danger/30 text-danger'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="p-3.5 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Terdapat perubahan yang belum disimpan. Tekan tombol &quot;Simpan Data Demo&quot; sebelum meninggalkan halaman.</span>
          </div>
        </div>
      )}

      {/* Main 11 Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border scrollbar-thin" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-text-muted hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs space-y-6">
        {/* TAB 1: HERO / COVER */}
        {activeTab === 'hero' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Pengaturan Cover &amp; Hero
            </h3>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Headline / Judul Pembuka
              </label>
              <input
                type="text"
                value={heroData.headline}
                onChange={(e) => {
                  setHeroData({ ...heroData, headline: e.target.value });
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Nama Pasangan Mempelai
              </label>
              <input
                type="text"
                value={heroData.couple_names}
                onChange={(e) => {
                  setHeroData({ ...heroData, couple_names: e.target.value });
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Teks Tanggal / Hari
                </label>
                <input
                  type="text"
                  value={heroData.opening_text}
                  onChange={(e) => {
                    setHeroData({ ...heroData, opening_text: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Lokasi Singkat
                </label>
                <input
                  type="text"
                  value={heroData.location}
                  onChange={(e) => {
                    setHeroData({ ...heroData, location: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Cover Image */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <label className="block text-xs font-semibold text-text-primary">
                  Foto Cover Amplop
                </label>
                {heroData.cover_image && (
                  <img
                    src={getDemoMediaPublicUrl(heroData.cover_image)}
                    alt="Preview Cover"
                    className="w-full h-36 object-cover rounded-lg border border-border"
                  />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImage('cover', file, (url) => {
                        setHeroData({ ...heroData, cover_image: url });
                      });
                    }
                  }}
                  className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
              </div>

              {/* Background Image */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <label className="block text-xs font-semibold text-text-primary">
                  Background Hero
                </label>
                {heroData.background_image && (
                  <img
                    src={getDemoMediaPublicUrl(heroData.background_image)}
                    alt="Preview Hero Background"
                    className="w-full h-36 object-cover rounded-lg border border-border"
                  />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImage('hero', file, (url) => {
                        setHeroData({ ...heroData, background_image: url });
                      });
                    }
                  }}
                  className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COUPLE */}
        {activeTab === 'couple' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Profil Mempelai (Couple)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mempelai Pria */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Mempelai Pria (Groom)
                </h4>

                {coupleData.groom_photo && (
                  <img
                    src={getDemoMediaPublicUrl(coupleData.groom_photo)}
                    alt="Foto Mempelai Pria"
                    className="w-full h-44 object-cover rounded-lg border border-border"
                  />
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Ganti Foto Groom
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage('groom', file, (url) => {
                          setCoupleData({ ...coupleData, groom_photo: url });
                        });
                      }
                    }}
                    className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={coupleData.groom_name}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, groom_name: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Nama Orang Tua
                  </label>
                  <input
                    type="text"
                    value={coupleData.groom_parents}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, groom_parents: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Bio Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={coupleData.groom_bio}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, groom_bio: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary"
                  />
                </div>
              </div>

              {/* Mempelai Wanita */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Mempelai Wanita (Bride)
                </h4>

                {coupleData.bride_photo && (
                  <img
                    src={getDemoMediaPublicUrl(coupleData.bride_photo)}
                    alt="Foto Mempelai Wanita"
                    className="w-full h-44 object-cover rounded-lg border border-border"
                  />
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Ganti Foto Bride
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage('bride', file, (url) => {
                          setCoupleData({ ...coupleData, bride_photo: url });
                        });
                      }
                    }}
                    className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={coupleData.bride_name}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, bride_name: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Nama Orang Tua
                  </label>
                  <input
                    type="text"
                    value={coupleData.bride_parents}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, bride_parents: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Bio Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={coupleData.bride_bio}
                    onChange={(e) => {
                      setCoupleData({ ...coupleData, bride_bio: e.target.value });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORY */}
        {activeTab === 'story' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Kisah Cinta (Story Timeline)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setStories([
                    ...stories,
                    {
                      id: `story-${Date.now()}`,
                      title: 'Momen Istimewa Baru',
                      year_date: '2026',
                      description: 'Deskripsi cerita perjalanan cinta.',
                      display_order: stories.length,
                      is_enabled: true,
                    },
                  ]);
                  markDirty();
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary-hover min-h-[36px]"
              >
                + Tambah Cerita
              </button>
            </div>

            {stories.map((st, idx) => (
              <div key={st.id} className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Cerita #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStories(stories.filter((_, i) => i !== idx));
                      markDirty();
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Hapus Cerita
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Judul Momen (mis. Pertemuan Pertama)"
                      value={st.title}
                      onChange={(e) => {
                        setStories(stories.map((item, i) => i === idx ? { ...item, title: e.target.value } : item));
                        markDirty();
                      }}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Tahun / Tanggal (mis. 2021)"
                      value={st.year_date}
                      onChange={(e) => {
                        setStories(stories.map((item, i) => i === idx ? { ...item, year_date: e.target.value } : item));
                        markDirty();
                      }}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Kisah atau narasi..."
                  value={st.description}
                  onChange={(e) => {
                    setStories(stories.map((item, i) => i === idx ? { ...item, description: e.target.value } : item));
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Rangkaian Acara (Akad, Resepsi, dll.)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEvents([
                    ...events,
                    {
                      id: `ev-${Date.now()}`,
                      title: 'Acara Tambahan',
                      date: '2026-10-24',
                      start_time: '19:00',
                      end_time: '21:00',
                      timezone: 'WIB',
                      venue_name: 'Nama Tempat',
                      address: 'Alamat lengkap',
                      maps_url: 'https://maps.google.com',
                      is_primary: false,
                    },
                  ]);
                  markDirty();
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary-hover min-h-[36px]"
              >
                + Tambah Acara
              </button>
            </div>

            {events.map((ev, idx) => (
              <div key={ev.id} className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">Acara #{idx + 1}</span>
                    {ev.is_primary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                        Acara Utama
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEvents(events.filter((_, i) => i !== idx));
                      markDirty();
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Hapus Acara
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Acara (mis. Akad Nikah)"
                    value={ev.title}
                    onChange={(e) => {
                      setEvents(events.map((item, i) => i === idx ? { ...item, title: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => {
                      setEvents(events.map((item, i) => i === idx ? { ...item, date: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="08:00 - 10:00"
                      value={`${ev.start_time}${ev.end_time ? ' - ' + ev.end_time : ''}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        setEvents(events.map((item, i) => i === idx ? {
                          ...item,
                          start_time: parts[0]?.trim() || item.start_time,
                          end_time: parts[1]?.trim() || item.end_time,
                        } : item));
                        markDirty();
                      }}
                      className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary w-full min-h-[40px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Tempat / Gedung"
                    value={ev.venue_name}
                    onChange={(e) => {
                      setEvents(events.map((item, i) => i === idx ? { ...item, venue_name: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                  <input
                    type="url"
                    placeholder="Tautan Google Maps"
                    value={ev.maps_url}
                    onChange={(e) => {
                      setEvents(events.map((item, i) => i === idx ? { ...item, maps_url: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Alamat lengkap..."
                  value={ev.address}
                  onChange={(e) => {
                    setEvents(events.map((item, i) => i === idx ? { ...item, address: e.target.value } : item));
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: GALLERY & MEDIA MANAGEMENT (Section H) */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Manajemen Media &amp; Galeri Foto (Section H)
                </h3>
                <p className="text-xs text-text-muted">
                  Storage bucket: <code className="font-mono bg-surface-elevated px-1.5 py-0.5 rounded">template-demo-media</code>. Format: JPEG, PNG, WebP (maks. 5MB).
                </p>
              </div>
            </div>

            {/* Drag & Multi-Upload Zone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/40 bg-surface-elevated text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-text-primary">
                Unggah Foto Galeri Demo (Dapat Memilih Banyak Berkas Sekaligus)
              </p>
              <p className="text-[11px] text-text-muted max-w-md mx-auto">
                File akan divalidasi dan disimpan dengan pola path resmi: <code className="font-mono text-[10px]">demo/{'{template_id}'}/gallery/{'{timestamp}_{uuid}'}.{'{ext}'}</code>
              </p>
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleUploadMultipleImages(e.target.files)}
                  className="inline-block text-xs text-text-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
            </div>

            {/* Gallery Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {gallery.map((item, idx) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-black/10 border border-border">
                      <img
                        src={getDemoMediaPublicUrl(item.image_url)}
                        alt={item.caption || 'Foto galeri'}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => {
                        setGallery(gallery.map((g, i) => i === idx ? { ...g, caption: e.target.value } : g));
                        markDirty();
                      }}
                      placeholder="Keterangan foto..."
                      className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary mt-2"
                    />
                  </div>

                  {/* Quick Assignment Actions */}
                  <div className="space-y-1.5 pt-1 border-t border-border">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Jadikan Foto:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setHeroData((prev) => ({ ...prev, cover_image: item.image_url }));
                          markDirty();
                          setFeedback({ type: 'success', message: 'Foto dijadikan Cover Amplop.' });
                        }}
                        className="px-2 py-1 rounded bg-surface hover:bg-border text-text-primary text-center truncate cursor-pointer"
                        title="Set as Cover"
                      >
                        Cover Amplop
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroData((prev) => ({ ...prev, background_image: item.image_url }));
                          markDirty();
                          setFeedback({ type: 'success', message: 'Foto dijadikan Hero Background.' });
                        }}
                        className="px-2 py-1 rounded bg-surface hover:bg-border text-text-primary text-center truncate cursor-pointer"
                        title="Set as Hero Background"
                      >
                        Hero BG
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoupleData((prev) => ({ ...prev, groom_photo: item.image_url }));
                          markDirty();
                          setFeedback({ type: 'success', message: 'Foto dijadikan Foto Mempelai Pria.' });
                        }}
                        className="px-2 py-1 rounded bg-surface hover:bg-border text-text-primary text-center truncate cursor-pointer"
                        title="Set as Groom Photo"
                      >
                        Foto Pria
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoupleData((prev) => ({ ...prev, bride_photo: item.image_url }));
                          markDirty();
                          setFeedback({ type: 'success', message: 'Foto dijadikan Foto Mempelai Wanita.' });
                        }}
                        className="px-2 py-1 rounded bg-surface hover:bg-border text-text-primary text-center truncate cursor-pointer"
                        title="Set as Bride Photo"
                      >
                        Foto Wanita
                      </button>
                    </div>

                    {/* Delete & Reorder */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const newGal = [...gallery];
                            const temp = newGal[idx - 1]!;
                            newGal[idx - 1] = newGal[idx]!;
                            newGal[idx] = temp;
                            setGallery(newGal);
                            markDirty();
                          }}
                          className="px-1.5 py-0.5 rounded text-[11px] bg-surface hover:bg-border disabled:opacity-30 cursor-pointer"
                          title="Geser ke kiri / atas"
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          disabled={idx === gallery.length - 1}
                          onClick={() => {
                            if (idx === gallery.length - 1) return;
                            const newGal = [...gallery];
                            const temp = newGal[idx + 1]!;
                            newGal[idx + 1] = newGal[idx]!;
                            newGal[idx] = temp;
                            setGallery(newGal);
                            markDirty();
                          }}
                          className="px-1.5 py-0.5 rounded text-[11px] bg-surface hover:bg-border disabled:opacity-30 cursor-pointer"
                          title="Geser ke kanan / bawah"
                        >
                          &rarr;
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setGallery(gallery.filter((_, i) => i !== idx));
                          markDirty();
                        }}
                        className="text-xs text-danger hover:underline cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: QUOTE */}
        {activeTab === 'quote' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Kutipan &amp; Ayat Suci (Quote)
            </h3>

            <div className="flex items-center gap-2">
              <input
                id="quote-enabled"
                type="checkbox"
                checked={quoteData.is_enabled}
                onChange={(e) => {
                  setQuoteData({ ...quoteData, is_enabled: e.target.checked });
                  markDirty();
                }}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="quote-enabled" className="text-xs font-semibold text-text-primary">
                Tampilkan seksi kutipan pada demo undangan
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Teks Arab (Opsional)</label>
              <textarea
                rows={2}
                dir="rtl"
                value={quoteData.arabic}
                onChange={(e) => {
                  setQuoteData({ ...quoteData, arabic: e.target.value });
                  markDirty();
                }}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-serif text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Terjemahan / Isi Kutipan</label>
              <textarea
                rows={3}
                value={quoteData.quote_text}
                onChange={(e) => {
                  setQuoteData({ ...quoteData, quote_text: e.target.value });
                  markDirty();
                }}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Sumber Kutipan</label>
              <input
                type="text"
                value={quoteData.source}
                onChange={(e) => {
                  setQuoteData({ ...quoteData, source: e.target.value });
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
              />
            </div>
          </div>
        )}

        {/* TAB 7: GIFT */}
        {activeTab === 'gift' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Amplop Digital &amp; Tanda Kasih (Gift)
            </h3>

            <div className="flex items-center gap-2">
              <input
                id="gift-enabled"
                type="checkbox"
                checked={giftData.is_enabled}
                onChange={(e) => {
                  setGiftData({ ...giftData, is_enabled: e.target.checked });
                  markDirty();
                }}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="gift-enabled" className="text-xs font-semibold text-text-primary">
                Aktifkan fitur amplop digital / nomor rekening demo
              </label>
            </div>

            {giftData.accounts.map((acc, idx) => (
              <div key={acc.id} className="p-3.5 rounded-xl bg-surface-elevated space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Bank / E-Wallet (mis. BCA)"
                    value={acc.provider}
                    onChange={(e) => {
                      setGiftData({
                        ...giftData,
                        accounts: giftData.accounts.map((item, i) => i === idx ? { ...item, provider: e.target.value } : item),
                      });
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening"
                    value={acc.account_number}
                    onChange={(e) => {
                      setGiftData({
                        ...giftData,
                        accounts: giftData.accounts.map((item, i) => i === idx ? { ...item, account_number: e.target.value } : item),
                      });
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Atas Nama Pemilik Rekening"
                  value={acc.holder_name}
                  onChange={(e) => {
                    setGiftData({
                      ...giftData,
                      accounts: giftData.accounts.map((item, i) => i === idx ? { ...item, holder_name: e.target.value } : item),
                    });
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: RSVP */}
        {activeTab === 'rsvp' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Konfirmasi Kehadiran (RSVP)
            </h3>

            <div className="p-4 rounded-xl bg-surface-elevated space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="rsvp-enabled"
                  type="checkbox"
                  checked={rsvpData.is_enabled}
                  onChange={(e) => {
                    setRsvpData({ ...rsvpData, is_enabled: e.target.checked });
                    markDirty();
                  }}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="rsvp-enabled" className="text-xs font-semibold text-text-primary">
                  Aktifkan formulir RSVP pada demo
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Judul RSVP</label>
                <input
                  type="text"
                  value={rsvpData.headline}
                  onChange={(e) => {
                    setRsvpData({ ...rsvpData, headline: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Deskripsi Tambahan</label>
                <input
                  type="text"
                  value={rsvpData.description}
                  onChange={(e) => {
                    setRsvpData({ ...rsvpData, description: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: WISHES */}
        {activeTab === 'wishes' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Doa &amp; Ucapan Tamu (Wishes Demo)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setWishesData((prev) => ({
                    ...prev,
                    sample_wishes: [
                      ...prev.sample_wishes,
                      {
                        id: `wish-${Date.now()}`,
                        sender_name: 'Sahabat Pengantin',
                        message: 'Selamat berbahagia, semoga langgeng dan selalu dalam lindungan-Nya.',
                        attendance_status: 'attending',
                        created_at: new Date().toISOString(),
                      },
                    ],
                  }));
                  markDirty();
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary-hover min-h-[36px]"
              >
                + Tambah Contoh Ucapan
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="wishes-toggle"
                type="checkbox"
                checked={wishesData.is_enabled}
                onChange={(e) => {
                  setWishesData({ ...wishesData, is_enabled: e.target.checked });
                  markDirty();
                }}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="wishes-toggle" className="text-xs font-semibold text-text-primary">
                Tampilkan seksi ucapan &amp; doa restu pada demo
              </label>
            </div>

            <div className="space-y-3 pt-2">
              {wishesData.sample_wishes.map((w, idx) => (
                <div key={w.id} className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Nama Pengirim Ucapan"
                      value={w.sender_name}
                      onChange={(e) => {
                        setWishesData({
                          ...wishesData,
                          sample_wishes: wishesData.sample_wishes.map((item, i) =>
                            i === idx ? { ...item, sender_name: e.target.value } : item
                          ),
                        });
                        markDirty();
                      }}
                      className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setWishesData({
                          ...wishesData,
                          sample_wishes: wishesData.sample_wishes.filter((_, i) => i !== idx),
                        });
                        markDirty();
                      }}
                      className="text-xs text-danger hover:underline ml-2"
                    >
                      Hapus
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Isi doa atau ucapan..."
                    value={w.message}
                    onChange={(e) => {
                      setWishesData({
                        ...wishesData,
                        sample_wishes: wishesData.sample_wishes.map((item, i) =>
                          i === idx ? { ...item, message: e.target.value } : item
                        ),
                      });
                      markDirty();
                    }}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: CLOSING */}
        {activeTab === 'closing' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Pesan Penutup (Closing Notes)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Pesan / Ucapan Terima Kasih Penutup
              </label>
              <textarea
                rows={3}
                value={closingData.closing_message}
                onChange={(e) => {
                  setClosingData({ ...closingData, closing_message: e.target.value });
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
              <label className="block text-xs font-semibold text-text-primary">
                Foto Penutup (Closing Portrait)
              </label>
              {closingData.image && (
                <img
                  src={getDemoMediaPublicUrl(closingData.image)}
                  alt="Foto Penutup"
                  className="w-full h-44 object-cover rounded-lg border border-border"
                />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadImage('closing', file, (url) => {
                      setClosingData({ ...closingData, image: url });
                    });
                  }
                }}
                className="w-full text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 11: THEME / VISUAL */}
        {activeTab === 'theme' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Tema &amp; Identitas Visual Template
            </h3>

            <p className="text-xs text-text-muted">
              Setiap template memiliki tema visual mandiri yang disematkan ke InvitationRenderer melalui ThemeInjector tanpa merusak Global Aurovia UI.
            </p>

            {/* Color Palette Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-2">
                <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: themeData.primary_color }} />
                <span className="text-[11px] font-bold text-text-primary block">Warna Utama</span>
                <span className="text-[10px] font-mono text-text-muted">{themeData.primary_color}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-2">
                <div className="h-10 rounded-lg shadow-inner" style={{ backgroundColor: themeData.secondary_color }} />
                <span className="text-[11px] font-bold text-text-primary block">Aksen Sekunder</span>
                <span className="text-[10px] font-mono text-text-muted">{themeData.secondary_color}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-2">
                <div className="h-10 rounded-lg shadow-inner border border-border" style={{ backgroundColor: themeData.background_color }} />
                <span className="text-[11px] font-bold text-text-primary block">Background</span>
                <span className="text-[10px] font-mono text-text-muted">{themeData.background_color}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-2">
                <div className="h-10 rounded-lg shadow-inner border border-border" style={{ backgroundColor: themeData.accent_color }} />
                <span className="text-[11px] font-bold text-text-primary block">Emas / Aksen</span>
                <span className="text-[10px] font-mono text-text-muted">{themeData.accent_color}</span>
              </div>
            </div>

            {/* Typography Preview */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border space-y-3">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                Tipografi &amp; Pasangan Font
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-text-muted">Heading Font:</span>
                  <p className="font-serif text-lg font-bold text-text-primary mt-1">
                    {themeData.heading_font}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-muted">Body &amp; UI Font:</span>
                  <p className="text-sm text-text-primary mt-1">
                    {themeData.body_font}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar: Save / Cancel / Open Demo Preview */}
      <div className="sticky bottom-4 z-30 bg-surface/95 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {selectedTemplate && (
            <a
              href={`/templates/${selectedTemplate.slug}/demo`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-border text-xs font-semibold text-text-primary transition-all min-h-[44px]"
            >
              <span>Buka Demo Publik</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving || !hasUnsavedChanges}
            className="px-4 py-2.5 bg-surface-elevated hover:bg-border text-text-muted hover:text-text-primary text-xs font-semibold rounded-xl transition-all min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Batal Perubahan
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || !hasUnsavedChanges}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-xl shadow-xs transition-all min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Data Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDemo;
