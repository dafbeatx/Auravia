import { useState, useEffect } from 'react';
import {
  getAdminTemplates,
  getTemplateDemoData,
  adminSaveTemplateDemo,
  uploadDemoMedia,
  getDemoMediaPublicUrl,
  type TemplateRow,
  type TemplateDemoData,
} from '@/lib/admin';

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

export function AdminDemo() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'hero' | 'couple' | 'story' | 'events' | 'gallery' | 'quote' | 'gift' | 'rsvp' | 'closing'
  >('hero');
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
  });

  const [stories, setStories] = useState<StoryItem[]>([
    {
      id: 'story-1',
      title: 'Awal Pertemuan',
      year_date: '2021',
      description: 'Pertama kali bertukar sapa di ruang seminar kampus, mengawali obrolan hangat.',
      display_order: 0,
      is_enabled: true,
    },
    {
      id: 'story-2',
      title: 'Komitmen Bersama',
      year_date: '2024',
      description: 'Dengan restu keluarga besar, kami membulatkan niat untuk melangkah bersama.',
      display_order: 1,
      is_enabled: true,
    },
  ]);

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'ev-1',
      title: 'Akad Nikah',
      date: '2026-10-24',
      start_time: '08:00',
      end_time: '10:00',
      timezone: 'WIB',
      venue_name: 'Masjid Agung Al-Ukhuwah Bandung',
      address: 'Jl. Wastukencana No. 27, Babakan Ciamis, Kota Bandung',
      maps_url: 'https://maps.google.com',
      is_primary: false,
    },
    {
      id: 'ev-2',
      title: 'Resepsi Pernikahan',
      date: '2026-10-24',
      start_time: '11:00',
      end_time: '14:00',
      timezone: 'WIB',
      venue_name: 'Grand Ballroom Hotel Aryaduta Bandung',
      address: 'Jl. Sumatera No. 51, Citarum, Kota Bandung',
      maps_url: 'https://maps.google.com',
      is_primary: true,
    },
  ]);

  const [gallery, setGallery] = useState<GalleryItem[]>([
    {
      id: 'gal-1',
      image_url: '/templates/royal/thumbnail.webp',
      caption: 'Potret langkah awal menuju hari bahagia.',
      display_order: 0,
    },
  ]);

  const [quoteData, setQuoteData] = useState({
    quote_text: 'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu.',
    source: 'QS. Ar-Rum: 21',
    arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا',
    is_enabled: true,
  });

  const [giftData, setGiftData] = useState<{
    is_enabled: boolean;
    accounts: BankItem[];
    physical_address: { recipient_name: string; address: string; is_enabled: boolean };
  }>({
    is_enabled: true,
    accounts: [
      {
        id: 'b-1',
        type: 'bank',
        provider: 'Bank Central Asia (BCA)',
        account_number: '7820194821',
        holder_name: 'Raka Pratama',
        is_enabled: true,
      },
    ],
    physical_address: {
      recipient_name: 'Raka & Aulia',
      address: 'Jl. Riau No. 45, Citarum, Kota Bandung, Jawa Barat 40115',
      is_enabled: true,
    },
  });

  const [rsvpData, setRsvpData] = useState({
    is_enabled: true,
    headline: 'Konfirmasi Kehadiran Tamu',
    description: 'Mohon konfirmasikan kehadiran Bapak/Ibu/Saudara/i untuk kenyamanan bersama.',
  });

  const [wishesData, setWishesData] = useState({
    is_enabled: true,
  });

  const [closingData, setClosingData] = useState({
    closing_message: 'Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
    image: '',
  });

  // Muat daftar template
  useEffect(() => {
    let isMounted = true;
    getAdminTemplates()
      .then((data) => {
        if (!isMounted) return;
        setTemplates(data);
        if (data.length > 0 && data[0]) {
          setSelectedTemplate(data[0]);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat template.',
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

  // Muat data demo saat template dipilih
  const loadDemoData = async (tmpl: TemplateRow) => {
    try {
      setLoading(true);
      setFeedback(null);
      const data = await getTemplateDemoData(tmpl.slug);
      if (data) {
        if (data.hero) setHeroData((prev) => ({ ...prev, ...(data.hero as typeof prev) }));
        if (data.couple) setCoupleData((prev) => ({ ...prev, ...(data.couple as typeof prev) }));
        if (data.story && Array.isArray(data.story) && data.story.length > 0) {
          setStories(data.story as StoryItem[]);
        }
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events as EventItem[]);
        }
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setGallery(data.gallery as GalleryItem[]);
        }
        if (data.quote) setQuoteData((prev) => ({ ...prev, ...(data.quote as typeof prev) }));
        if (data.gift) setGiftData((prev) => ({ ...prev, ...(data.gift as typeof prev) }));
        if (data.rsvp) setRsvpData((prev) => ({ ...prev, ...(data.rsvp as typeof prev) }));
        if (data.wishes) setWishesData((prev) => ({ ...prev, ...(data.wishes as typeof prev) }));
        if (data.closing) setClosingData((prev) => ({ ...prev, ...(data.closing as typeof prev) }));
      }
      setHasUnsavedChanges(false);
    } catch {
      // Fallback ke nilai awal jika belum pernah disimpan
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (tmpl: TemplateRow) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Ada perubahan data demo yang belum disimpan. Yakin ingin berganti template?'
      );
      if (!confirmLeave) return;
    }
    setSelectedTemplate(tmpl);
    loadDemoData(tmpl);
  };

  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // Upload gambar demo
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
      setFeedback({ type: 'success', message: 'Media demo berhasil diunggah.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah gambar.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Simpan data demo ke database
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

  const tabs = [
    { id: 'hero', label: 'Cover & Hero' },
    { id: 'couple', label: 'Mempelai (Couple)' },
    { id: 'story', label: 'Cerita (Story)' },
    { id: 'events', label: 'Acara (Event)' },
    { id: 'gallery', label: 'Galeri Foto' },
    { id: 'quote', label: 'Kutipan (Quote)' },
    { id: 'gift', label: 'Tanda Kasih (Gift)' },
    { id: 'rsvp', label: 'RSVP & Ucapan' },
    { id: 'closing', label: 'Penutup (Closing)' },
  ] as const;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Template Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Manajemen Konten Demo Template
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Atur data pratinjau publik representatif untuk setiap template agar tampil profesional dan elegan.
          </p>
        </div>

        {/* Template Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="demo-template-select" className="text-xs font-semibold text-text-muted whitespace-nowrap">
            Template:
          </label>
          <select
            id="demo-template-select"
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const tmpl = templates.find((t) => t.id === e.target.value);
              if (tmpl) handleSelectTemplate(tmpl);
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
        <div className="p-3 rounded-xl bg-surface border border-border flex items-center gap-2.5 text-xs text-text-muted">
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
            <span>Terdapat perubahan yang belum disimpan. Jangan lupa menekan tombol Simpan.</span>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        {/* TAB: HERO / COVER */}
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

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Unggah Gambar Cover / Background (Maks. 5 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadImage('hero', file, (url) => {
                      setHeroData({ ...heroData, cover_image: url, background_image: url });
                    });
                  }
                }}
                className="block w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
              />
              {heroData.cover_image && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={getDemoMediaPublicUrl(heroData.cover_image)}
                    alt="Cover preview"
                    className="w-16 h-20 object-cover rounded-lg border border-border"
                  />
                  <span className="text-[11px] text-text-muted break-all">
                    {heroData.cover_image}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: COUPLE */}
        {activeTab === 'couple' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Profil Mempelai (Groom &amp; Bride)
            </h3>

            {/* Groom Section */}
            <div className="p-4 rounded-xl bg-surface-elevated space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Mempelai Pria (Groom)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  value={coupleData.groom_name}
                  onChange={(e) => {
                    setCoupleData({ ...coupleData, groom_name: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Keterangan Orang Tua</label>
                <input
                  type="text"
                  value={coupleData.groom_parents}
                  onChange={(e) => {
                    setCoupleData({ ...coupleData, groom_parents: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Unggah Foto Pria</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImage('couple', file, (url) => {
                        setCoupleData({ ...coupleData, groom_photo: url });
                      });
                    }
                  }}
                  className="text-xs text-text-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
            </div>

            {/* Bride Section */}
            <div className="p-4 rounded-xl bg-surface-elevated space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Mempelai Wanita (Bride)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  value={coupleData.bride_name}
                  onChange={(e) => {
                    setCoupleData({ ...coupleData, bride_name: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Keterangan Orang Tua</label>
                <input
                  type="text"
                  value={coupleData.bride_parents}
                  onChange={(e) => {
                    setCoupleData({ ...coupleData, bride_parents: e.target.value });
                    markDirty();
                  }}
                  className="w-full px-3.5 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Unggah Foto Wanita</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImage('couple', file, (url) => {
                        setCoupleData({ ...coupleData, bride_photo: url });
                      });
                    }
                  }}
                  className="text-xs text-text-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: STORY */}
        {activeTab === 'story' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Kisah &amp; Linimasa (Love Story)
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newItem: StoryItem = {
                    id: `story-${Date.now()}`,
                    title: 'Babak Baru',
                    year_date: '2026',
                    description: 'Catatan perjalanan indah bersama pasangan.',
                    display_order: stories.length,
                    is_enabled: true,
                  };
                  setStories([...stories, newItem]);
                  markDirty();
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-xs min-h-[36px]"
              >
                + Tambah Cerita
              </button>
            </div>

            {stories.map((st, idx) => (
              <div key={st.id} className="p-4 rounded-xl bg-surface-elevated space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Item #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                      <input
                        type="checkbox"
                        checked={st.is_enabled}
                        onChange={(e) => {
                          setStories(stories.map((item, i) => i === idx ? { ...item, is_enabled: e.target.checked } : item));
                          markDirty();
                        }}
                        className="rounded text-primary"
                      />
                      <span>Aktif</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStories(stories.filter((_, i) => i !== idx));
                        markDirty();
                      }}
                      className="text-xs text-danger hover:underline ml-2"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Judul momen"
                    value={st.title}
                    onChange={(e) => {
                      setStories(stories.map((item, i) => i === idx ? { ...item, title: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                  <input
                    type="text"
                    placeholder="Tahun / Tanggal"
                    value={st.year_date}
                    onChange={(e) => {
                      setStories(stories.map((item, i) => i === idx ? { ...item, year_date: e.target.value } : item));
                      markDirty();
                    }}
                    className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary min-h-[40px]"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Deskripsi cerita..."
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

        {/* TAB: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Rangkaian Acara (Events)
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newEv: EventItem = {
                    id: `ev-${Date.now()}`,
                    title: 'Acara Tambahan',
                    date: '2026-10-24',
                    start_time: '19:00',
                    end_time: '21:00',
                    timezone: 'WIB',
                    venue_name: 'Lokasi Acara',
                    address: 'Alamat lengkap tempat pelaksanaan',
                    maps_url: 'https://maps.google.com',
                    is_primary: false,
                  };
                  setEvents([...events, newEv]);
                  markDirty();
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-xs min-h-[36px]"
              >
                + Tambah Acara
              </button>
            </div>

            {events.map((ev, idx) => (
              <div key={ev.id} className="p-4 rounded-xl bg-surface-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Acara #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEvents(events.filter((_, i) => i !== idx));
                      markDirty();
                    }}
                    className="text-xs text-danger hover:underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nama Acara"
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
                      value={`${ev.start_time} - ${ev.end_time}`}
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

        {/* TAB: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Galeri Foto Demo (Supabase Storage: template-demo-media)
              </h3>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-surface-elevated text-center space-y-2">
              <p className="text-xs font-semibold text-text-primary">
                Unggah Foto Baru ke Galeri Demo
              </p>
              <p className="text-[11px] text-text-muted">
                Format didukung: JPEG, PNG, WebP. Ukuran berkas maksimum: 5 MB.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadImage('gallery', file, (url) => {
                      setGallery([
                        ...gallery,
                        {
                          id: `gal-${Date.now()}`,
                          image_url: url,
                          caption: 'Momen berharga dalam balutan kebersamaan.',
                          display_order: gallery.length,
                        },
                      ]);
                    });
                  }
                }}
                className="inline-block text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {gallery.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl bg-surface-elevated border border-border space-y-2">
                  <img
                    src={getDemoMediaPublicUrl(item.image_url)}
                    alt={item.caption || 'Foto galeri'}
                    className="w-full h-36 object-cover rounded-lg border border-border/80"
                  />
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => {
                      setGallery(gallery.map((g, i) => i === idx ? { ...g, caption: e.target.value } : g));
                      markDirty();
                    }}
                    placeholder="Keterangan foto..."
                    className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-text-muted">Urutan #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setGallery(gallery.filter((_, i) => i !== idx));
                        markDirty();
                      }}
                      className="text-xs text-danger hover:underline"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: QUOTE */}
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

        {/* TAB: GIFT */}
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

        {/* TAB: RSVP & WISHES */}
        {activeTab === 'rsvp' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-primary border-b border-border pb-2">
              Konfirmasi RSVP &amp; Doa Ucapan
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

            <div className="p-4 rounded-xl bg-surface-elevated space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="wishes-enabled"
                  type="checkbox"
                  checked={wishesData.is_enabled}
                  onChange={(e) => {
                    setWishesData({ ...wishesData, is_enabled: e.target.checked });
                    markDirty();
                  }}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="wishes-enabled" className="text-xs font-semibold text-text-primary">
                  Aktifkan kartu ucapan &amp; doa restu pada demo
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLOSING */}
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
