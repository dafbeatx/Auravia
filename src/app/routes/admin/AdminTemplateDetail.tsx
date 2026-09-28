import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  getAdminTemplateById,
  createAdminTemplate,
  updateAdminTemplate,
  uploadTemplatePreviewImage,
  deleteTemplateAsset,
  getTemplateAssetPublicUrl,
  getTemplateDemoData,
  adminSaveTemplateDemo,
  uploadDemoMedia,
  getDemoMediaPublicUrl,
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
  image?: string;
  display_order: number;
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

interface AdminTemplateDetailProps {
  defaultTab?: 'identity' | 'theme' | 'demo' | 'media';
}

export function AdminTemplateDetail({ defaultTab }: AdminTemplateDetailProps = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';

  const initialTab = defaultTab || (location.pathname.endsWith('/media') ? 'media' : 'identity');
  const [activeTab, setActiveTab] = useState<'identity' | 'theme' | 'demo' | 'media'>(initialTab);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Identitas Template
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'wedding',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    is_featured: false,
    display_order: 0,
    thumbnail_url: '',
    preview_mobile_path: '' as string | null,
    preview_desktop_path: '' as string | null,
    preview_thumbnail_path: '' as string | null,
  });

  // 2. Tema Visual (Theme)
  const [themeColors, setThemeColors] = useState({
    background: '#FAF9F6',
    primary: '#0A1324',
    secondary: '#D4AF37',
    accent: '#C5A059',
    text: '#1A1A1A',
    muted: '#737373',
    border: '#E5E5E5',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Plus Jakarta Sans',
  });

  // 3. Demo Content
  const [heroData, setHeroData] = useState({
    headline: 'Walimatul Ursy',
    opening_text: 'Sabtu, 24 Oktober 2026',
    couple_names: 'Raka & Aulia',
    date: '2026-10-24',
    location: 'Grand Ballroom Hotel Aryaduta Bandung',
    background_image: '',
    cover_image: '',
    cta_text: 'Buka Undangan',
  });

  const [coupleData, setCoupleData] = useState({
    groom_name: 'Raka Pratama, S.T.',
    groom_nickname: 'Raka',
    groom_role: 'Mempelai Pria',
    groom_photo: '',
    groom_parents: 'Putra pertama dari Bpk. Ir. H. Hendra Pratama & Ibu Hj. Ratna Juwita',
    groom_description: 'Putra pertama yang berdedikasi dan penuh kehangatan dalam membina keluarga.',
    bride_name: 'Aulia Nurfadilah, S.Farm.',
    bride_nickname: 'Aulia',
    bride_role: 'Mempelai Wanita',
    bride_photo: '',
    bride_parents: 'Putri bungsu dari Bpk. Drs. H. Achmad Fauzan & Ibu Hj. Dewi Sartika',
    bride_description: 'Putri bungsu yang santun dan gemar menebarkan keceriaan.',
  });

  const [stories, setStories] = useState<StoryItem[]>([
    {
      id: 'story-1',
      title: 'Awal Pertemuan',
      year_date: '2021',
      description: 'Pertama kali bertukar sapa di ruang seminar kampus, mengawali obrolan hangat.',
      image: '',
      display_order: 0,
      is_enabled: true,
    },
    {
      id: 'story-2',
      title: 'Komitmen Bersama',
      year_date: '2024',
      description: 'Dengan restu keluarga besar, kami membulatkan niat untuk melangkah bersama.',
      image: '',
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
      image: '',
      display_order: 0,
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
      image: '',
      display_order: 1,
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

  const [giftData, setGiftData] = useState<{
    is_enabled: boolean;
    accounts: BankItem[];
    ewallet: string;
    qr_image: string;
  }>({
    is_enabled: true,
    accounts: [
      {
        id: 'acc-1',
        type: 'bank',
        provider: 'Bank Central Asia (BCA)',
        account_number: '7825-1123-90',
        holder_name: 'Raka Pratama',
        is_enabled: true,
      },
    ],
    ewallet: 'GoPay / OVO: 0812-3456-7890 (Aulia Nurfadilah)',
    qr_image: '',
  });

  const [rsvpConfig, setRsvpConfig] = useState({
    enabled: true,
    headline: 'Konfirmasi Kehadiran (RSVP)',
    description: 'Mohon berkenan mengisi formulir konfirmasi kehadiran di bawah ini untuk membantu penyelenggaraan acara.',
    options: ['Hadir', 'Tidak Dapat Hadir', 'Masih Ragu'],
  });

  const [wishesConfig, setWishesConfig] = useState({
    enabled: true,
    headline: 'Ucapan & Doa Restu',
    description: 'Untaian kata doa restu dan harapan terbaik Anda merupakan berkah tak terhingga bagi kami.',
  });

  const [musicConfig, setMusicConfig] = useState({
    enabled: true,
    title: 'A Thousand Years (Acoustic Piano)',
    music_url: '',
  });

  // Muat data template dan demo data
  useEffect(() => {
    if (isNew || !id) return;

    let isMounted = true;
    setLoading(true);

    getAdminTemplateById(id)
      .then(async (tmpl) => {
        if (!isMounted) return;
        if (!tmpl) {
          setFeedback({ type: 'error', message: 'Template tidak ditemukan.' });
          return;
        }

        setFormData({
          name: tmpl.name,
          slug: tmpl.slug,
          category: tmpl.category,
          description: tmpl.description,
          status: tmpl.status,
          is_featured: tmpl.is_featured,
          display_order: tmpl.display_order,
          thumbnail_url: tmpl.thumbnail_url,
          preview_mobile_path: tmpl.preview_mobile_path,
          preview_desktop_path: tmpl.preview_desktop_path,
          preview_thumbnail_path: tmpl.preview_thumbnail_path,
        });

        // Muat theme colors jika tersedia di default_theme
        if (tmpl.default_theme && typeof tmpl.default_theme === 'object') {
          const dt = tmpl.default_theme as Record<string, unknown>;
          const colors = (dt.colors || {}) as Record<string, string>;
          const fonts = (dt.fonts || {}) as Record<string, string>;
          setThemeColors({
            background: colors.background || '#FAF9F6',
            primary: colors.primary || '#0A1324',
            secondary: colors.secondary || '#D4AF37',
            accent: colors.accent || '#C5A059',
            text: colors.text || '#1A1A1A',
            muted: colors.muted || '#737373',
            border: colors.border || '#E5E5E5',
            headingFont: fonts.heading || 'Cormorant Garamond',
            bodyFont: fonts.body || 'Plus Jakarta Sans',
          });
        }

        // Muat data demo dari tabel template_demos
        try {
          const demo = await getTemplateDemoData(tmpl.slug);
          if (demo && isMounted) {
            if (demo.hero && typeof demo.hero === 'object') {
              const h = demo.hero as Record<string, string>;
              setHeroData((prev) => ({
                ...prev,
                headline: h.headline || prev.headline,
                opening_text: h.opening_text || prev.opening_text,
                couple_names: h.couple_names || prev.couple_names,
                date: h.date || prev.date,
                location: h.location || prev.location,
                background_image: h.background_image || prev.background_image,
                cover_image: h.cover_image || prev.cover_image,
                cta_text: h.cta_text || prev.cta_text,
              }));
            }

            if (demo.couple && typeof demo.couple === 'object') {
              const c = demo.couple as Record<string, string>;
              setCoupleData((prev) => ({
                ...prev,
                groom_name: c.groom_name || prev.groom_name,
                groom_nickname: c.groom_nickname || prev.groom_nickname,
                groom_role: c.groom_role || prev.groom_role,
                groom_photo: c.groom_photo || prev.groom_photo,
                groom_parents: c.groom_parents || prev.groom_parents,
                groom_description: c.groom_description || c.groom_bio || prev.groom_description,
                bride_name: c.bride_name || prev.bride_name,
                bride_nickname: c.bride_nickname || prev.bride_nickname,
                bride_role: c.bride_role || prev.bride_role,
                bride_photo: c.bride_photo || prev.bride_photo,
                bride_parents: c.bride_parents || prev.bride_parents,
                bride_description: c.bride_description || c.bride_bio || prev.bride_description,
              }));
            }

            if (Array.isArray(demo.story) && demo.story.length > 0) {
              setStories(demo.story as StoryItem[]);
            }

            if (Array.isArray(demo.events) && demo.events.length > 0) {
              setEvents(demo.events as EventItem[]);
            }

            if (Array.isArray(demo.gallery) && demo.gallery.length > 0) {
              setGallery(demo.gallery as GalleryItem[]);
            }

            if (demo.gift && typeof demo.gift === 'object') {
              const g = demo.gift as Record<string, unknown>;
              setGiftData({
                is_enabled: g.is_enabled !== false,
                accounts: Array.isArray(g.accounts) ? (g.accounts as BankItem[]) : [],
                ewallet: (g.ewallet as string) || '',
                qr_image: (g.qr_image as string) || '',
              });
            }

            if (demo.rsvp && typeof demo.rsvp === 'object') {
              const r = demo.rsvp as Record<string, unknown>;
              setRsvpConfig({
                enabled: r.enabled !== false,
                headline: (r.headline as string) || 'Konfirmasi Kehadiran (RSVP)',
                description: (r.description as string) || 'Mohon berkenan mengisi formulir kehadiran.',
                options: Array.isArray(r.options) ? (r.options as string[]) : ['Hadir', 'Tidak Hadir'],
              });
            }

            if (demo.wishes && typeof demo.wishes === 'object') {
              const w = demo.wishes as Record<string, unknown>;
              setWishesConfig({
                enabled: w.enabled !== false,
                headline: (w.headline as string) || 'Ucapan & Doa Restu',
                description: (w.description as string) || 'Untaian doa restu Anda adalah berkah bagi kami.',
              });
            }
          }
        } catch {
          // Abaikan jika demo data belum dibuat
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
  }, [id, isNew]);

  // Simpan Seluruh Perubahan (Identitas, Tema, Demo Content)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setFeedback({
        type: 'error',
        message: 'Format slug tidak valid. Hanya boleh berisi huruf kecil, angka, dan strip (contoh: royal-gold).',
      });
      setSaving(false);
      return;
    }

    const compiledTheme = {
      colors: {
        background: themeColors.background,
        primary: themeColors.primary,
        secondary: themeColors.secondary,
        accent: themeColors.accent,
        text: themeColors.text,
        muted: themeColors.muted,
        border: themeColors.border,
      },
      fonts: {
        heading: themeColors.headingFont,
        body: themeColors.bodyFont,
      },
    };

    const compiledDemoData: Partial<TemplateDemoData> = {
      hero: heroData,
      couple: coupleData,
      story: stories,
      events: events,
      gallery: gallery,
      gift: giftData,
      rsvp: rsvpConfig,
      wishes: wishesConfig,
      closing: {
        couple_names: heroData.couple_names,
        headline: 'Terima Kasih',
        subheadline: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
      },
    };

    try {
      if (isNew) {
        const created = await createAdminTemplate({
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          status: formData.status,
          is_active: formData.status === 'active',
          is_featured: formData.is_featured,
          display_order: Number(formData.display_order),
          thumbnail_url: formData.thumbnail_url || `/templates/${formData.slug}/thumbnail.webp`,
          preview_mobile_path: formData.preview_mobile_path,
          preview_desktop_path: formData.preview_desktop_path,
          preview_thumbnail_path: formData.preview_thumbnail_path,
          default_theme: compiledTheme,
          default_sections: [],
        });

        // Simpan demo data awal
        await adminSaveTemplateDemo(created.id, compiledDemoData);

        setFeedback({ type: 'success', message: 'Template baru berhasil dibuat!' });
        setTimeout(() => {
          navigate(`/admin/templates/${created.id}`);
        }, 800);
      } else if (id) {
        await Promise.all([
          updateAdminTemplate(id, {
            name: formData.name,
            slug: formData.slug,
            category: formData.category,
            description: formData.description,
            status: formData.status,
            is_active: formData.status === 'active',
            is_featured: formData.is_featured,
            display_order: Number(formData.display_order),
            thumbnail_url: formData.thumbnail_url,
            preview_mobile_path: formData.preview_mobile_path,
            preview_desktop_path: formData.preview_desktop_path,
            preview_thumbnail_path: formData.preview_thumbnail_path,
            default_theme: compiledTheme,
          }),
          adminSaveTemplateDemo(id, compiledDemoData),
        ]);

        setFeedback({ type: 'success', message: 'Seluruh konfigurasi template dan konten demo berhasil disimpan!' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan perubahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload Berkas Media Preview
  const handlePreviewUpload = async (
    type: 'mobile' | 'desktop' | 'thumbnail',
    file: File
  ) => {
    if (!id || isNew) {
      setFeedback({
        type: 'error',
        message: 'Harap simpan template baru terlebih dahulu sebelum mengunggah gambar preview.',
      });
      return;
    }

    setUploading(type);
    setFeedback(null);

    const oldPath =
      type === 'mobile'
        ? formData.preview_mobile_path
        : type === 'desktop'
        ? formData.preview_desktop_path
        : formData.preview_thumbnail_path;

    try {
      const { path, publicUrl } = await uploadTemplatePreviewImage(id, type, file);

      const updatePayload =
        type === 'mobile'
          ? { preview_mobile_path: path }
          : type === 'desktop'
          ? { preview_desktop_path: path }
          : { preview_thumbnail_path: path, thumbnail_url: publicUrl };

      await updateAdminTemplate(id, updatePayload);

      setFormData((prev) => ({
        ...prev,
        ...(type === 'mobile' && { preview_mobile_path: path }),
        ...(type === 'desktop' && { preview_desktop_path: path }),
        ...(type === 'thumbnail' && {
          preview_thumbnail_path: path,
          thumbnail_url: publicUrl,
        }),
      }));

      if (oldPath && oldPath !== path) {
        await deleteTemplateAsset(oldPath);
      }

      setFeedback({
        type: 'success',
        message: `Gambar preview ${type} berhasil diperbarui!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah berkas.',
      });
    } finally {
      setUploading(null);
    }
  };

  // Upload Berkas Media Demo (Hero, Couple, Story, Gallery, dsb)
  const handleDemoMediaUpload = async (
    targetField: string,
    file: File,
    section: string = 'general'
  ) => {
    if (!id || isNew) {
      setFeedback({
        type: 'error',
        message: 'Harap simpan template baru terlebih dahulu sebelum mengunggah media demo.',
      });
      return;
    }

    setUploading(targetField);
    setFeedback(null);

    try {
      const { publicUrl } = await uploadDemoMedia(id, section, file);

      // Perbarui field yang dituju
      if (targetField === 'hero_cover') {
        setHeroData((prev) => ({ ...prev, cover_image: publicUrl }));
      } else if (targetField === 'hero_bg') {
        setHeroData((prev) => ({ ...prev, background_image: publicUrl }));
      } else if (targetField === 'groom_photo') {
        setCoupleData((prev) => ({ ...prev, groom_photo: publicUrl }));
      } else if (targetField === 'bride_photo') {
        setCoupleData((prev) => ({ ...prev, bride_photo: publicUrl }));
      } else if (targetField === 'qr_image') {
        setGiftData((prev) => ({ ...prev, qr_image: publicUrl }));
      } else if (targetField.startsWith('story_image_')) {
        const storyId = targetField.replace('story_image_', '');
        setStories((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, image: publicUrl } : s))
        );
      } else if (targetField.startsWith('event_image_')) {
        const evId = targetField.replace('event_image_', '');
        setEvents((prev) =>
          prev.map((ev) => (ev.id === evId ? { ...ev, image: publicUrl } : ev))
        );
      } else if (targetField === 'new_gallery_photo') {
        const newPhotoItem: GalleryItem = {
          id: `gal-${Date.now()}`,
          image_url: publicUrl,
          caption: 'Foto galeri kenangan bahagia.',
          display_order: gallery.length,
        };
        setGallery((prev) => [...prev, newPhotoItem]);
      }

      setFeedback({
        type: 'success',
        message: 'Media demo berhasil diunggah ke Supabase Storage!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah media demo.',
      });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Memuat konfigurasi template &amp; demo...</p>
      </div>
    );
  }

  const mobilePreviewUrl = getTemplateAssetPublicUrl(formData.preview_mobile_path);
  const desktopPreviewUrl = getTemplateAssetPublicUrl(formData.preview_desktop_path);
  const thumbnailPreviewUrl = getTemplateAssetPublicUrl(
    formData.preview_thumbnail_path || formData.thumbnail_url
  );

  return (
    <div className="space-y-6 pb-20 max-w-6xl">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            {isNew ? 'Tambah Template Baru' : `Pengaturan: ${formData.name}`}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Konfigurasi identitas katalog, palet tema warna, konten demo pernikahan, dan media aset.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/templates"
            className="py-2.5 px-3.5 bg-white border border-[#9ACBD0] text-gray-700 hover:bg-[#F2FEF7] rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center"
          >
            ← Kembali
          </Link>

          {!isNew && (
            <Link
              to={`/templates/${formData.slug}/demo`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-[#48A6A7] hover:bg-[#3b8c8d] text-white rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center gap-1.5 shadow-2xs"
            >
              <span>Preview Demo</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="py-2.5 px-5 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white border border-[#9ACBD0]/60 rounded-2xl shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0 cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-[#006A71] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-[#F2FEF7]'
          }`}
        >
          A. Identitas &amp; Mockup
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0 cursor-pointer ${
            activeTab === 'theme'
              ? 'bg-[#006A71] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-[#F2FEF7]'
          }`}
        >
          B. Tema Visual (Theme)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('demo')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0 cursor-pointer ${
            activeTab === 'demo'
              ? 'bg-[#006A71] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-[#F2FEF7]'
          }`}
        >
          C. Konten Demo Template
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0 cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#006A71] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-[#F2FEF7]'
          }`}
        >
          D. Media Manager
        </button>
      </div>

      {/* TAB 1: IDENTITAS & MOCKUP */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
                Identitas Template
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Royal Navy & Gold"
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Slug URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="royal-navy-gold"
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                />
                <p className="text-[10px] text-gray-400">
                  Rute demo publik: /templates/{formData.slug || 'slug'}/demo
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Kategori Template
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                >
                  <option value="wedding">Pernikahan (Wedding)</option>
                  <option value="birthday">Ulang Tahun (Birthday)</option>
                  <option value="corporate">Acara Korporat (Corporate)</option>
                  <option value="general">Umum (General)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Karakteristik visual, nuansa, dan keunggulan desain template ini..."
                  className="w-full px-3.5 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
                Status &amp; Tampilan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Status Publikasi
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'draft' | 'active' | 'archived',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  >
                    <option value="active">ACTIVE (Tampil di Publik)</option>
                    <option value="draft">DRAFT (Hanya Admin)</option>
                    <option value="archived">ARCHIVED (Diarsipkan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Urutan Tampil (Display Order)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                />
                <label htmlFor="is_featured" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Tampilkan sebagai Pilihan Unggulan (Featured di Landing Page)
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Box Upload Mobile Preview */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Mobile Preview Mockup
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  Card Display
                </span>
              </div>

              <div className="w-full h-40 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative">
                {mobilePreviewUrl ? (
                  <img src={mobilePreviewUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] text-gray-400">Belum ada mockup mobile</span>
                )}
                {uploading === 'mobile' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isNew || uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePreviewUpload('mobile', file);
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>

            {/* Box Upload Thumbnail */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
              <div className="border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Thumbnail Card
                </h4>
              </div>

              <div className="w-full h-28 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative">
                {thumbnailPreviewUrl ? (
                  <img src={thumbnailPreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] text-gray-400">Belum ada thumbnail</span>
                )}
                {uploading === 'thumbnail' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isNew || uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePreviewUpload('thumbnail', file);
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>

            {/* Box Upload Desktop Preview */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
              <div className="border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Desktop Preview
                </h4>
              </div>

              <div className="w-full h-28 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative">
                {desktopPreviewUrl ? (
                  <img src={desktopPreviewUrl} alt="Desktop Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] text-gray-400">Belum ada desktop preview</span>
                )}
                {uploading === 'desktop' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isNew || uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePreviewUpload('desktop', file);
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMA VISUAL (THEME) */}
      {activeTab === 'theme' && (
        <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-6">
          <div className="border-b border-[#9ACBD0]/30 pb-3">
            <h3 className="font-serif text-base font-bold text-[#006A71]">
              Palet Warna &amp; Tipografi Tema Template
            </h3>
            <p className="text-xs text-gray-400">
              Gunakan color picker dan kode hex untuk mengatur nuansa visual template ini secara terpusat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Background Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.background}
                  onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.background}
                  onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Primary</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Secondary</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors({ ...themeColors, secondary: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.accent}
                  onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.accent}
                  onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Teks Utama</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.text}
                  onChange={(e) => setThemeColors({ ...themeColors, text: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.text}
                  onChange={(e) => setThemeColors({ ...themeColors, text: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Muted Text Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Muted Text</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.muted}
                  onChange={(e) => setThemeColors({ ...themeColors, muted: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.muted}
                  onChange={(e) => setThemeColors({ ...themeColors, muted: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Border Color */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Warna Garis Pembatas (Border)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColors.border}
                  onChange={(e) => setThemeColors({ ...themeColors, border: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={themeColors.border}
                  onChange={(e) => setThemeColors({ ...themeColors, border: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Heading Font */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Font Heading (Editorial)</label>
              <input
                type="text"
                value={themeColors.headingFont}
                onChange={(e) => setThemeColors({ ...themeColors, headingFont: e.target.value })}
                placeholder="Cormorant Garamond"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-serif"
              />
            </div>

            {/* Body Font */}
            <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block">Font Body (UI)</label>
              <input
                type="text"
                value={themeColors.bodyFont}
                onChange={(e) => setThemeColors({ ...themeColors, bodyFont: e.target.value })}
                placeholder="Plus Jakarta Sans"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KONTEN DEMO TEMPLATE */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Section C: Hero Demo */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
              C. Hero &amp; Cover Demo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Headline / Judul Acara</label>
                <input
                  type="text"
                  value={heroData.headline}
                  onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Nama Pasangan Mempelai</label>
                <input
                  type="text"
                  value={heroData.couple_names}
                  onChange={(e) => setHeroData({ ...heroData, couple_names: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-semibold min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Teks Pembuka / Tanggal</label>
                <input
                  type="text"
                  value={heroData.opening_text}
                  onChange={(e) => setHeroData({ ...heroData, opening_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Lokasi Utama Acara</label>
                <input
                  type="text"
                  value={heroData.location}
                  onChange={(e) => setHeroData({ ...heroData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs min-h-[44px]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block">Teks Tombol CTA</label>
                <input
                  type="text"
                  value={heroData.cta_text}
                  onChange={(e) => setHeroData({ ...heroData, cta_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Section D: Couple Demo (Pria & Wanita) */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
              D. Profil Mempelai (Couple Demo)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mempelai Pria */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-3">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gray-700">
                  Mempelai Pria
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    value={coupleData.groom_name}
                    onChange={(e) => setCoupleData({ ...coupleData, groom_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Nama Panggilan</label>
                  <input
                    type="text"
                    value={coupleData.groom_nickname}
                    onChange={(e) => setCoupleData({ ...coupleData, groom_nickname: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Orang Tua / Nasab</label>
                  <textarea
                    rows={2}
                    value={coupleData.groom_parents}
                    onChange={(e) => setCoupleData({ ...coupleData, groom_parents: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Deskripsi / Bio</label>
                  <textarea
                    rows={2}
                    value={coupleData.groom_description}
                    onChange={(e) => setCoupleData({ ...coupleData, groom_description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Mempelai Wanita */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-3">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gray-700">
                  Mempelai Wanita
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    value={coupleData.bride_name}
                    onChange={(e) => setCoupleData({ ...coupleData, bride_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Nama Panggilan</label>
                  <input
                    type="text"
                    value={coupleData.bride_nickname}
                    onChange={(e) => setCoupleData({ ...coupleData, bride_nickname: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Orang Tua / Nasab</label>
                  <textarea
                    rows={2}
                    value={coupleData.bride_parents}
                    onChange={(e) => setCoupleData({ ...coupleData, bride_parents: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 block">Deskripsi / Bio</label>
                  <textarea
                    rows={2}
                    value={coupleData.bride_description}
                    onChange={(e) => setCoupleData({ ...coupleData, bride_description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Story Demo (CRUD) */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                E. Kisah Cerita (Story Demo)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setStories((prev) => [
                    ...prev,
                    {
                      id: `story-${Date.now()}`,
                      title: 'Momen Baru',
                      year_date: '2025',
                      description: 'Catatan perjalanan indah yang kami lalui bersama.',
                      display_order: prev.length,
                      is_enabled: true,
                    },
                  ])
                }
                className="py-1.5 px-3 bg-[#006A71] text-white rounded-lg text-xs font-semibold hover:bg-[#00575d] cursor-pointer min-h-[36px]"
              >
                + Tambah Cerita
              </button>
            </div>

            <div className="space-y-3">
              {stories.map((st, idx) => (
                <div key={st.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Momen #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setStories((prev) => prev.filter((item) => item.id !== st.id))}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Judul Momen"
                      value={st.title}
                      onChange={(e) =>
                        setStories((prev) =>
                          prev.map((item) => (item.id === st.id ? { ...item, title: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Tahun / Tanggal"
                      value={st.year_date}
                      onChange={(e) =>
                        setStories((prev) =>
                          prev.map((item) => (item.id === st.id ? { ...item, year_date: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Deskripsi cerita..."
                    value={st.description}
                    onChange={(e) =>
                      setStories((prev) =>
                        prev.map((item) => (item.id === st.id ? { ...item, description: e.target.value } : item))
                      )
                    }
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Events Demo (CRUD) */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                F. Rangkaian Acara (Events Demo)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setEvents((prev) => [
                    ...prev,
                    {
                      id: `ev-${Date.now()}`,
                      title: 'Acara Baru',
                      date: '2026-10-24',
                      start_time: '10:00',
                      end_time: '12:00',
                      timezone: 'WIB',
                      venue_name: 'Lokasi Acara',
                      address: 'Alamat lengkap',
                      maps_url: 'https://maps.google.com',
                      display_order: prev.length,
                      is_primary: false,
                    },
                  ])
                }
                className="py-1.5 px-3 bg-[#006A71] text-white rounded-lg text-xs font-semibold hover:bg-[#00575d] cursor-pointer min-h-[36px]"
              >
                + Tambah Acara
              </button>
            </div>

            <div className="space-y-3">
              {events.map((ev, idx) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Acara #{idx + 1}: {ev.title}</span>
                    <button
                      type="button"
                      onClick={() => setEvents((prev) => prev.filter((item) => item.id !== ev.id))}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Acara"
                      value={ev.title}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === ev.id ? { ...item, title: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="date"
                      value={ev.date}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === ev.id ? { ...item, date: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={ev.start_time}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) => (item.id === ev.id ? { ...item, start_time: e.target.value } : item))
                          )
                        }
                        className="w-1/2 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input
                        type="time"
                        value={ev.end_time}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) => (item.id === ev.id ? { ...item, end_time: e.target.value } : item))
                          )
                        }
                        className="w-1/2 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Tempat / Gedung"
                      value={ev.venue_name}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === ev.id ? { ...item, venue_name: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Alamat Lengkap"
                      value={ev.address}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) => (item.id === ev.id ? { ...item, address: e.target.value } : item))
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section G: Gallery Demo */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                G. Galeri Foto Demo
              </h3>
              <label className="py-1.5 px-3 bg-[#006A71] text-white rounded-lg text-xs font-semibold hover:bg-[#00575d] cursor-pointer min-h-[36px] inline-flex items-center">
                + Upload Foto Galeri
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDemoMediaUpload('new_gallery_photo', file, 'gallery');
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {gallery.map((g, idx) => (
                <div key={g.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="w-full h-32 rounded-lg bg-gray-200 overflow-hidden relative">
                    <img
                      src={getDemoMediaPublicUrl(g.image_url)}
                      alt={g.caption || `Foto #${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={g.caption}
                    onChange={(e) =>
                      setGallery((prev) =>
                        prev.map((item) => (item.id === g.id ? { ...item, caption: e.target.value } : item))
                      )
                    }
                    placeholder="Keterangan foto..."
                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-[11px]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setGallery((prev) => prev.filter((item) => item.id !== g.id))}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section H, I, J, K: Gift, RSVP, Wishes, Music */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gift Demo */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
              <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider border-b border-[#9ACBD0]/30 pb-2">
                H. Hadiah Digital (Gift Demo)
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Informasi E-Wallet"
                  value={giftData.ewallet}
                  onChange={(e) => setGiftData({ ...giftData, ewallet: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Music Demo */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
              <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider border-b border-[#9ACBD0]/30 pb-2">
                K. Musik Pengiring (Music Demo)
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Judul Lagu"
                  value={musicConfig.title}
                  onChange={(e) => setMusicConfig({ ...musicConfig, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="URL Audio / Storage Path"
                  value={musicConfig.music_url}
                  onChange={(e) => setMusicConfig({ ...musicConfig, music_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEDIA MANAGER (SECTION 9) */}
      {activeTab === 'media' && (
        <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-6">
          <div className="border-b border-[#9ACBD0]/30 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                Media Manager Template (Supabase Storage)
              </h3>
              <p className="text-xs text-gray-400">
                Kelola seluruh aset grafis demo (Cover, Hero, Foto Mempelai, Cerita, Acara, Galeri).
                Validasi format JPEG, PNG, WebP maksimal 5 MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Asset 1: Cover / Hero Image */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">Cover / Background Hero</span>
              <div className="w-full h-36 rounded-lg bg-gray-200 overflow-hidden relative flex items-center justify-center">
                {heroData.cover_image ? (
                  <img src={getDemoMediaPublicUrl(heroData.cover_image)} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Belum ada foto cover</span>
                )}
                {uploading === 'hero_cover' && (
                  <div className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center">
                    Mengunggah...
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDemoMediaUpload('hero_cover', file, 'hero');
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>

            {/* Asset 2: Foto Mempelai Pria */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">Foto Mempelai Pria (Groom)</span>
              <div className="w-full h-36 rounded-lg bg-gray-200 overflow-hidden relative flex items-center justify-center">
                {coupleData.groom_photo ? (
                  <img src={getDemoMediaPublicUrl(coupleData.groom_photo)} alt="Groom" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Belum ada foto pria</span>
                )}
                {uploading === 'groom_photo' && (
                  <div className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center">
                    Mengunggah...
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDemoMediaUpload('groom_photo', file, 'couple');
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>

            {/* Asset 3: Foto Mempelai Wanita */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">Foto Mempelai Wanita (Bride)</span>
              <div className="w-full h-36 rounded-lg bg-gray-200 overflow-hidden relative flex items-center justify-center">
                {coupleData.bride_photo ? (
                  <img src={getDemoMediaPublicUrl(coupleData.bride_photo)} alt="Bride" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Belum ada foto wanita</span>
                )}
                {uploading === 'bride_photo' && (
                  <div className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center">
                    Mengunggah...
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDemoMediaUpload('bride_photo', file, 'couple');
                }}
                className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-[#006A71] file:text-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action */}
      <div className="pt-4 border-t border-[#9ACBD0]/40 flex items-center justify-end gap-3">
        <Link
          to="/admin/templates"
          className="py-2.5 px-5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all min-h-[44px] flex items-center"
        >
          Batal
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="py-2.5 px-6 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : isNew ? 'Buat Template' : 'Simpan Seluruh Perubahan'}
        </button>
      </div>
    </div>
  );
}
