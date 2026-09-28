import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getSystemSettings,
  updateSystemSettings,
  recordAdminActivity,
  type SystemSettingsData,
} from '@/lib/admin';

interface FeatureCardItem {
  id: string;
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export function AdminContent() {
  const { isSuperAdmin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'features' | 'faq'>('hero');

  // Hero section form state
  const [heroHeadline, setHeroHeadline] = useState('Abadikan Momen Sakral dalam Lembaran Digital Abadi');
  const [heroSubheadline, setHeroSubheadline] = useState(
    'Desain kurasi eksklusif, RSVP terkonfirmasi, dan tata visual anggun untuk pernikahan impian Anda.'
  );
  const [heroCtaText, setHeroCtaText] = useState('Mulai Buat Undangan');
  const [heroCtaLink, setHeroCtaLink] = useState('/register');
  const [secondaryCtaText, setSecondaryCtaText] = useState('Lihat Katalog Template');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('/#template');
  const [heroImageUrl, setHeroImageUrl] = useState('');

  // Visibility state
  const [sectionVisibility, setSectionVisibility] = useState({
    hero: true,
    features: true,
    template_showcase: true,
    invitation_preview: true,
    process: true,
    faq: true,
    cta_banner: true,
  });

  // Feature cards state
  const [features, setFeatures] = useState<FeatureCardItem[]>([
    {
      id: 'feat-1',
      title: 'Desain Tipografi Anggun',
      description: 'Kurasi font serif editorial yang menghadirkan aura sakral dan mewah bagi setiap lembar undangan Anda.',
    },
    {
      id: 'feat-2',
      title: 'RSVP & Buku Tamu Real-time',
      description: 'Konfirmasi kehadiran langsung masuk ke dashboard dengan integrasi ucapan selamat dari para kerabat.',
    },
    {
      id: 'feat-3',
      title: 'Navigasi Lokasi Interaktif',
      description: 'Integrasi peta Google Maps presisi untuk memudahkan para tamu menemukan lokasi akad dan resepsi.',
    },
    {
      id: 'feat-4',
      title: 'Amplop Digital Aman',
      description: 'Fasilitas transfer langsung ke rekening bank atau e-wallet tanpa perantara dengan verifikasi nomor yang jelas.',
    },
  ]);

  // FAQ state
  const [faqItems, setFaqItems] = useState<FaqItem[]>([
    {
      question: 'Berapa lama proses pembuatan undangan di Aurovia?',
      answer: 'Undangan digital dapat selesai dan siap dibagikan dalam waktu kurang dari 10 menit setelah Anda mengisi data acara.',
    },
    {
      question: 'Apakah saya dapat mengganti template setelah undangan dibuat?',
      answer: 'Ya, Anda dapat beralih antar template kapan saja tanpa kehilangan data pengantin atau daftar acara yang sudah diinput.',
    },
    {
      question: 'Bagaimana cara menyebarkan undangan ke tamu personal?',
      answer: 'Aurovia menyediakan generator tautan personal (misal: /i/raka-aulia?to=Nama+Tamu) sehingga nama tamu tertera manis pada sampul pembuka.',
    },
    {
      question: 'Apakah tamu memerlukan aplikasi untuk membuka undangan?',
      answer: 'Tidak. Undangan digital Aurovia berbasis web ringan yang dapat dibuka dengan cepat di browser seluler maupun desktop.',
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSystemSettings()
      .then((data: SystemSettingsData) => {
        if (!isMounted) return;
        const lc = data.landing_content;
        if (lc) {
          if (lc.hero_headline) setHeroHeadline(lc.hero_headline);
          if (lc.hero_subheadline) setHeroSubheadline(lc.hero_subheadline);
          if (lc.hero_cta_text) setHeroCtaText(lc.hero_cta_text);
          if (lc.hero_cta_link) setHeroCtaLink(lc.hero_cta_link);
          if (lc.secondary_cta_text) setSecondaryCtaText(lc.secondary_cta_text);
          if (lc.secondary_cta_link) setSecondaryCtaLink(lc.secondary_cta_link);
          if (lc.hero_image_url) setHeroImageUrl(lc.hero_image_url);

          if (lc.section_visibility && typeof lc.section_visibility === 'object') {
            setSectionVisibility((prev) => ({
              ...prev,
              ...(lc.section_visibility as Record<string, boolean>),
            }));
          }

          if (Array.isArray(lc.features) && lc.features.length > 0) {
            setFeatures(
              (lc.features as Array<{ id?: string; title?: string; description?: string }>).map((f, i) => ({
                id: f.id || `feat-${i + 1}`,
                title: f.title || '',
                description: f.description || '',
              }))
            );
          }

          if (Array.isArray(lc.faq_items) && lc.faq_items.length > 0) {
            setFaqItems(
              (lc.faq_items as Array<{ question?: string; answer?: string }>).map((fq) => ({
                question: fq.question || '',
                answer: fq.answer || '',
              }))
            );
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat pengaturan konten landing.',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setFeedback({
        type: 'error',
        message: 'Hanya Super Admin yang berhak memperbarui konten landing page.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      landing_content: {
        hero_headline: heroHeadline.trim(),
        hero_subheadline: heroSubheadline.trim(),
        hero_cta_text: heroCtaText.trim(),
        hero_cta_link: heroCtaLink.trim(),
        secondary_cta_text: secondaryCtaText.trim(),
        secondary_cta_link: secondaryCtaLink.trim(),
        hero_image_url: heroImageUrl.trim(),
        section_visibility: sectionVisibility,
        features: features,
        faq_items: faqItems,
      },
    };

    try {
      await updateSystemSettings(payload);
      await recordAdminActivity('content_updated', 'system_settings', 'current', {
        section: 'landing',
        headline: heroHeadline.trim(),
      });
      setFeedback({
        type: 'success',
        message: 'Konten landing page berhasil diperbarui!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan konten landing page.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureChange = (index: number, field: 'title' | 'description', value: string) => {
    setFeatures((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (current) {
        updated[index] = {
          id: current.id,
          title: field === 'title' ? value : current.title,
          description: field === 'description' ? value : current.description,
        };
      }
      return updated;
    });
  };

  const handleAddFaq = () => {
    setFaqItems((prev) => [
      ...prev,
      { question: 'Pertanyaan Baru', answer: 'Jawaban detail untuk pertanyaan ini.' },
    ]);
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqItems((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (current) {
        updated[index] = {
          question: field === 'question' ? value : current.question,
          answer: field === 'answer' ? value : current.answer,
        };
      }
      return updated;
    });
  };

  const handleDeleteFaq = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Konten Landing Page
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Sesuaikan teks headline, tautan CTA, kartu fitur, dan FAQ publik tanpa harus mengubah source code.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#9ACBD0]/60 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'hero' ? 'bg-[#006A71] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hero &amp; CTA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'sections' ? 'bg-[#006A71] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Visibilitas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'features' ? 'bg-[#006A71] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fitur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'faq' ? 'bg-[#006A71] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQ
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Memuat konfigurasi konten landing page...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: Hero & CTA */}
          {activeTab === 'hero' && (
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-5">
              <div className="border-b border-[#9ACBD0]/30 pb-3">
                <h3 className="font-serif text-base font-bold text-[#006A71]">
                  Headline &amp; Ajakan Bertindak (CTA)
                </h3>
                <p className="text-xs text-gray-400">Teks utama yang dilihat pertama kali oleh pengunjung beranda.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Headline Utama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Subheadline Pendukung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={heroSubheadline}
                    onChange={(e) => setHeroSubheadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      Teks Tombol CTA Utama
                    </label>
                    <input
                      type="text"
                      required
                      value={heroCtaText}
                      onChange={(e) => setHeroCtaText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      Tautan URL CTA Utama
                    </label>
                    <input
                      type="text"
                      required
                      value={heroCtaLink}
                      onChange={(e) => setHeroCtaLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      Teks Tombol Sekunder
                    </label>
                    <input
                      type="text"
                      value={secondaryCtaText}
                      onChange={(e) => setSecondaryCtaText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      Tautan URL Tombol Sekunder
                    </label>
                    <input
                      type="text"
                      value={secondaryCtaLink}
                      onChange={(e) => setSecondaryCtaLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    URL Gambar Hero (Opsional)
                  </label>
                  <input
                    type="text"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://... atau /images/hero.webp"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                  <p className="text-[10px] text-gray-400">Jika dikosongkan, halaman beranda menggunakan mock visual interaktif bawaan.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Visibilitas Bagian */}
          {activeTab === 'sections' && (
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="border-b border-[#9ACBD0]/30 pb-3">
                <h3 className="font-serif text-base font-bold text-[#006A71]">
                  Visibilitas Bagian Halaman Beranda
                </h3>
                <p className="text-xs text-gray-400">Aktifkan atau sembunyikan modul tertentu dari pengunjung umum.</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'hero', title: 'Bagian Hero Pembuka', desc: 'Headline, subheadline, tombol CTA, dan ilustrasi sampul' },
                  { key: 'features', title: 'Bagian Kartu Fitur', desc: 'Penjelasan 4 pilar fitur unggulan platform' },
                  { key: 'template_showcase', title: 'Katalog Template Pilihan', desc: 'Slider template digital interaktif dan tombol demo' },
                  { key: 'invitation_preview', title: 'Pratinjau Undangan Interaktif', desc: 'Tabs interaktif simulasi sampul, mempelai, acara, dan RSVP' },
                  { key: 'process', title: 'Alur Cara Kerja (Workflow)', desc: 'Langkah mudah pembuatan undangan dari pilih hingga sebar' },
                  { key: 'faq', title: 'Pertanyaan Umum (FAQ)', desc: 'Daftar tanya jawab seputar layanan Aurovia' },
                  { key: 'cta_banner', title: 'Banner Ajakan Akhir', desc: 'Banner persuasif di atas footer untuk registrasi' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100/70 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">{item.title}</span>
                      <span className="text-[11px] text-gray-500">{item.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sectionVisibility[item.key as keyof typeof sectionVisibility] ?? true}
                      onChange={(e) =>
                        setSectionVisibility({
                          ...sectionVisibility,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Kartu Fitur */}
          {activeTab === 'features' && (
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="border-b border-[#9ACBD0]/30 pb-3">
                <h3 className="font-serif text-base font-bold text-[#006A71]">
                  Kartu Keunggulan &amp; Fitur
                </h3>
                <p className="text-xs text-gray-400">Edit isi judul dan deskripsi 4 pilar keunggulan pada halaman beranda.</p>
              </div>

              <div className="space-y-4">
                {features.map((feat, idx) => (
                  <div key={feat.id || idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-[#006A71] uppercase tracking-wider block">
                      Fitur #{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">Judul Fitur</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#9ACBD0]/60 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[40px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">Deskripsi Fitur</label>
                      <textarea
                        rows={2}
                        value={feat.description}
                        onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#9ACBD0]/60 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FAQ */}
          {activeTab === 'faq' && (
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#006A71]">
                    Pertanyaan Umum (FAQ)
                  </h3>
                  <p className="text-xs text-gray-400">Kelola daftar tanya jawab yang muncul di bagian Bantuan.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="py-1.5 px-3 bg-[#006A71] hover:bg-[#00575d] text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah FAQ</span>
                </button>
              </div>

              <div className="space-y-4">
                {faqItems.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        FAQ #{idx + 1}
                      </span>
                      {faqItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(idx)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold p-1 cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">Pertanyaan</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#9ACBD0]/60 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[40px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">Jawaban</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#9ACBD0]/60 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving || !isSuperAdmin}
              className="py-2.5 px-6 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Konten'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
