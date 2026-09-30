import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveTemplates, type TemplateListItem } from '@/lib/templates';
import { getAllTemplateDefinitions } from '@/lib/template/definitions';
import { MonogramFrame } from '@/components/template/ornaments';
import { trackCatalogView } from '@/lib/analytics';
import { getTemplateAssetPublicUrl } from '@/lib/admin';

interface TemplateCarouselProps {
  className?: string;
}

export function TemplateCarousel({ className = '' }: TemplateCarouselProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const touchStartXRef = useRef<number | null>(null);

  // Hitung jumlah item per layar berdasarkan breakpoint responsif
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(1);
      } else if (width < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Muat data template dari database atau fallback ke definisi kode
  useEffect(() => {
    let isMounted = true;
    getActiveTemplates()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setTemplates(data);
        } else {
          const fallback = getAllTemplateDefinitions().map((def) => ({
            id: def.id,
            slug: def.slug,
            name: def.name,
            category: def.category,
            description: def.description,
            thumbnail_url: def.identity?.thumbnailUrl || '',
            default_theme: def.defaultTheme as unknown as import('@/types/database').Json,
            default_sections: def.sections as unknown as import('@/types/database').Json,
            is_active: true,
            status: 'active' as const,
            display_order: 0,
            is_featured: false,
            preview_desktop_path: null,
            preview_mobile_path: null,
            preview_thumbnail_path: null,
          }));
          setTemplates(fallback);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = getAllTemplateDefinitions().map((def) => ({
          id: def.id,
          slug: def.slug,
          name: def.name,
          category: def.category,
          description: def.description,
          thumbnail_url: def.identity?.thumbnailUrl || '',
          default_theme: def.defaultTheme as unknown as import('@/types/database').Json,
          default_sections: def.sections as unknown as import('@/types/database').Json,
          is_active: true,
          status: 'active' as const,
          display_order: 0,
          is_featured: false,
          preview_desktop_path: null,
          preview_mobile_path: null,
          preview_thumbnail_path: null,
        }));
        setTemplates(fallback);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          trackCatalogView(user?.id);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const maxIndex = Math.max(0, templates.length - itemsPerView);

  // Pastikan currentIndex selalu valid jika itemsPerView berubah
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [itemsPerView, maxIndex, currentIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  // Dukungan navigasi keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Dukungan gesture swipe pada perangkat sentuh
  const handleTouchStart = (e: React.TouchEvent) => {
    const firstTouch = e.touches[0];
    if (firstTouch) {
      touchStartXRef.current = firstTouch.clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const firstChangedTouch = e.changedTouches[0];
    if (!firstChangedTouch) return;

    const touchEndX = firstChangedTouch.clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Render visual preview berbentuk smartphone frame realistis (seperti pada referensi Foto 2)
  const renderPhoneMockup = (tmpl: TemplateListItem) => {
    const uploadedImageUrl = tmpl.preview_mobile_path
      ? getTemplateAssetPublicUrl(tmpl.preview_mobile_path)
      : tmpl.thumbnail_url && !tmpl.thumbnail_url.endsWith('thumbnail.webp')
      ? getTemplateAssetPublicUrl(tmpl.thumbnail_url)
      : null;

    let screenContent;

    const demoCoverPhoto = `/images/demo/${tmpl.slug}/cover.jpg`;

    if (uploadedImageUrl) {
      screenContent = (
        <div className="w-full h-full bg-slate-900 relative overflow-hidden">
          <img
            src={uploadedImageUrl}
            alt={`Preview template ${tmpl.name}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>
      );
    } else {
      switch (tmpl.slug) {
        case 'royal-navy-gold':
          screenContent = (
            <div className="w-full h-full text-[#F8FAFC] p-3 pt-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <img
                src={demoCoverPhoto}
                alt="Royal Navy & Gold Preview"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1324] via-[#0A1324]/60 to-[#0A1324]/70" />
              <div className="space-y-1 relative z-10">
                <span className="text-[7px] uppercase tracking-widest text-[#D4AF37] font-mono block">
                  Walimatul Ursy
                </span>
                <div className="py-0.5">
                  <MonogramFrame initials="R & A" variant="royal-circle" />
                </div>
              </div>

              <div className="space-y-0.5 my-auto relative z-10">
                <h4 className="font-serif text-sm sm:text-base text-[#D4AF37] font-normal tracking-wide">
                  Raka &amp; Aulia
                </h4>
                <p className="text-[8px] text-[#F8FAFC]/80 font-sans">
                  Sabtu, 24 Oktober 2026
                </p>
              </div>

              <div className="w-full relative z-10 pb-2">
                <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-[#132238]/90 border border-[#D4AF37]/50 text-[#D4AF37] text-[8px] font-medium shadow-xs">
                  <span>✉</span>
                  <span>Buka Undangan</span>
                </div>
              </div>
            </div>
          );
          break;

        case 'botanical-garden':
          screenContent = (
            <div className="w-full h-full text-[#1E3A2F] p-3 pt-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <img
                src={demoCoverPhoto}
                alt="Botanical Garden Preview"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F4F6F0] via-[#F4F6F0]/70 to-[#F4F6F0]/80" />
              <div className="space-y-1 relative z-10">
                <span className="text-[7px] uppercase tracking-widest text-[#2D4F3F] font-sans font-semibold block">
                  The Wedding Of
                </span>
                <div className="w-7 h-7 mx-auto rounded-full border border-[#7A9A7B] bg-[#E2ECE2] flex items-center justify-center text-[#2D4F3F] text-[9px] font-serif font-bold">
                  A &amp; F
                </div>
              </div>

              <div className="space-y-0.5 my-auto relative z-10">
                <h4 className="font-serif text-sm sm:text-base text-[#2D4F3F] font-normal tracking-wide">
                  Amira &amp; Fajar
                </h4>
                <p className="text-[8px] text-[#526A5E] font-sans">
                  Minggu, 12 Desember 2026
                </p>
              </div>

              <div className="w-full relative z-10 pb-2">
                <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-[#2D4F3F] text-white text-[8px] font-medium shadow-xs">
                  <span>✉</span>
                  <span>Buka Undangan</span>
                </div>
              </div>
            </div>
          );
          break;

        case 'modern-minimal':
          screenContent = (
            <div className="w-full h-full text-[#0F172A] p-3 pt-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <img
                src={demoCoverPhoto}
                alt="Modern Minimal Preview"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/70 to-[#F8F9FA]/80" />
              <div className="space-y-1 relative z-10">
                <span className="text-[7px] uppercase tracking-widest text-primary font-mono font-semibold block">
                  Modern Union
                </span>
                <div className="w-6 h-6 mx-auto border border-primary text-primary flex items-center justify-center text-[9px] font-sans font-bold">
                  N &amp; R
                </div>
              </div>

              <div className="space-y-0.5 my-auto relative z-10">
                <h4 className="font-sans text-xs sm:text-sm text-[#0F172A] font-bold tracking-tight">
                  Nadia &amp; Reza
                </h4>
                <div className="w-8 h-0.5 bg-primary/40 mx-auto my-1" />
                <p className="text-[8px] text-[#64748B] font-sans">
                  Sabtu, 08 November 2026
                </p>
              </div>

              <div className="w-full relative z-10 pb-2">
                <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-[8px] font-medium shadow-xs">
                  <span>✉</span>
                  <span>Buka Undangan</span>
                </div>
              </div>
            </div>
          );
          break;

        case 'classic-elegance':
        default:
          screenContent = (
            <div className="w-full h-full text-[#292524] p-3 pt-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <img
                src={demoCoverPhoto}
                alt="Classic Elegance Preview"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/70 to-[#FAF9F6]/80" />
              <div className="space-y-1 relative z-10">
                <span className="text-[7px] uppercase tracking-widest text-[#78716C] font-sans block">
                  The Wedding Of
                </span>
                <div className="py-0.5">
                  <MonogramFrame initials="S & D" variant="classic-ring" />
                </div>
              </div>

              <div className="space-y-0.5 my-auto relative z-10">
                <h4 className="font-serif text-sm sm:text-base text-[#292524] font-normal tracking-wide">
                  Sarah &amp; Dimas
                </h4>
                <p className="text-[8px] text-[#78716C] font-sans">
                  Minggu, 20 September 2026
                </p>
              </div>

              <div className="w-full relative z-10 pb-2">
                <div className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-[#292524] text-white text-[8px] font-medium shadow-xs">
                  <span>✉</span>
                  <span>Buka Undangan</span>
                </div>
              </div>
            </div>
          );
          break;
      }
    }

    return (
      <div className="relative w-[145px] sm:w-[165px] h-[270px] sm:h-[300px] mx-auto my-1 rounded-[2.2rem] p-[5px] bg-[#111827] shadow-xl border border-slate-700/60 ring-1 ring-black/40 flex flex-col transition-transform duration-300 group-hover:scale-[1.03]">
        {/* Dynamic Island Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-12 h-3.5 bg-black rounded-full flex items-center justify-end px-1.5 shadow-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
        </div>

        {/* Screen Bezel Container */}
        <div className="relative w-full h-full rounded-[1.85rem] overflow-hidden flex flex-col justify-between select-none">
          {screenContent}
        </div>
      </div>
    );
  };

  const totalPages = maxIndex + 1;

  if (loading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-text-muted">Memuat katalog template...</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Katalog Carousel Template Undangan"
    >
      {/* Kontainer Carousel Track */}
      <div
        className="overflow-hidden w-full py-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {templates.map((tmpl) => {
            const demoUrl = `/templates/${tmpl.slug}/demo`;
            const actionUrl = user
              ? demoUrl
              : `/login?redirect=${encodeURIComponent(demoUrl)}`;

            // Kategori label
            const categoryLabel =
              tmpl.slug === 'royal-navy-gold'
                ? 'Royal / Islamic'
                : tmpl.slug === 'botanical-garden'
                ? 'Floral / Botanical'
                : tmpl.slug === 'modern-minimal'
                ? 'Modern / Contemporary'
                : 'Classic / Editorial';

            return (
              <div
                key={tmpl.id || tmpl.slug}
                className="flex-shrink-0 px-2.5 sm:px-3"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                {/* Smartphone Device Frame Card (Seperti Foto 2) */}
                <div className="group bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-secondary/40 transition-all flex flex-col h-full">
                  {/* Container Mockup Ponsel */}
                  <div className="relative w-full p-4 sm:p-5 bg-surface-elevated/40 flex items-center justify-center overflow-hidden border-b border-border/60">
                    {renderPhoneMockup(tmpl)}
                  </div>

                  {/* Konten Card: Nama Template & Tombol Lihat Demo */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between items-center text-center space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                        {tmpl.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                        {categoryLabel}
                      </p>
                      {tmpl.description && (
                        <p className="text-xs text-text-muted font-normal line-clamp-2 pt-1 px-1">
                          {tmpl.description}
                        </p>
                      )}
                    </div>

                    <div className="w-full pt-1">
                      <Link
                        to={actionUrl}
                        className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                      >
                        Lihat Demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigasi Carousel: Tombol Prev / Next Lingkaran & Pagination Dots (Seperti Foto 2) */}
      <div className="mt-8 flex items-center justify-center gap-6">
        {/* Tombol Prev Lingkaran */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Template sebelumnya"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-border bg-surface hover:bg-surface-elevated text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-xs active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Pagination Dots di Tengah */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Halaman carousel template">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Pindah ke slide ${idx + 1}`}
              aria-selected={currentIndex === idx}
              role="tab"
              className={`transition-all rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                currentIndex === idx
                  ? 'w-6 h-2.5 bg-primary'
                  : 'w-2.5 h-2.5 bg-border hover:bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Tombol Next Lingkaran */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          aria-label="Template berikutnya"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-border bg-surface hover:bg-surface-elevated text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-xs active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
