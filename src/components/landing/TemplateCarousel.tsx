import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveTemplates, type TemplateListItem } from '@/lib/templates';
import { getAllTemplateDefinitions } from '@/lib/template/definitions';
import { DecorativeDivider, MonogramFrame } from '@/components/template/ornaments';

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
        }));
        setTemplates(fallback);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Render visual preview berbasis CSS sesuai konfigurasi template
  const renderTemplateVisual = (slug: string) => {
    switch (slug) {
      case 'royal-navy-gold':
        return (
          <div className="w-full h-full bg-[#0A1324] text-[#F8FAFC] p-4 flex flex-col items-center justify-center text-center space-y-2 border border-[#D4AF37]/30 transition-transform duration-300 group-hover:scale-105">
            <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-mono">
              Walimatul Ursy
            </span>
            <MonogramFrame initials="R & D" variant="royal-circle" />
            <h4 className="font-serif text-lg sm:text-xl text-[#D4AF37] font-normal tracking-wide">
              Rika &amp; Dani
            </h4>
            <DecorativeDivider variant="royal" />
            <p className="text-[10px] text-[#F8FAFC]/80">
              Sabtu, 24 Oktober 2026
            </p>
          </div>
        );

      case 'botanical-garden':
        return (
          <div className="w-full h-full bg-[#F4F6F0] text-[#1E3A2F] p-4 flex flex-col items-center justify-center text-center space-y-2 border border-[#D3DDD3] transition-transform duration-300 group-hover:scale-105">
            <span className="text-[9px] uppercase tracking-widest text-[#2D4F3F] font-sans font-semibold">
              The Wedding Celebration
            </span>
            <div className="w-8 h-8 rounded-full border border-[#7A9A7B] bg-[#E2ECE2] flex items-center justify-center text-[#2D4F3F] text-xs font-serif font-bold">
              A &amp; F
            </div>
            <h4 className="font-serif text-lg sm:text-xl text-[#2D4F3F] font-normal tracking-wide">
              Amira &amp; Fajar
            </h4>
            <DecorativeDivider variant="diamond" />
            <p className="text-[10px] text-[#526A5E]">
              Minggu, 12 Desember 2026
            </p>
          </div>
        );

      case 'modern-minimal':
        return (
          <div className="w-full h-full bg-[#F8F9FA] text-[#0F172A] p-4 flex flex-col items-center justify-center text-center space-y-2 border border-[#E2E8F0] transition-transform duration-300 group-hover:scale-105">
            <span className="text-[9px] uppercase tracking-widest text-primary font-mono font-semibold">
              Modern Union
            </span>
            <div className="w-8 h-8 border border-primary text-primary flex items-center justify-center text-xs font-sans font-bold">
              N &amp; R
            </div>
            <h4 className="font-sans text-base sm:text-lg text-[#0F172A] font-semibold tracking-tight">
              Nadia &amp; Reza
            </h4>
            <div className="w-12 h-0.5 bg-primary/40 my-1" />
            <p className="text-[10px] text-[#64748B]">
              Sabtu, 08 November 2026
            </p>
          </div>
        );

      case 'classic-elegance':
      default:
        return (
          <div className="w-full h-full bg-[#FAF9F6] text-[#292524] p-4 flex flex-col items-center justify-center text-center space-y-2 border border-[#E7E5E0] transition-transform duration-300 group-hover:scale-105">
            <span className="text-[9px] uppercase tracking-widest text-[#78716C] font-sans">
              The Wedding Of
            </span>
            <MonogramFrame initials="S & D" variant="classic-ring" />
            <h4 className="font-serif text-lg sm:text-xl text-[#292524] font-normal tracking-wide">
              Sarah &amp; Dimas
            </h4>
            <DecorativeDivider variant="diamond" />
            <p className="text-[10px] text-[#78716C]">
              Minggu, 20 September 2026
            </p>
          </div>
        );
    }
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
                {/* Landscape Card Template */}
                <div className="group bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-secondary/40 transition-all flex flex-col h-full">
                  {/* Bagian Visual Preview Landscape (Elemen Terbesar) */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-elevated">
                    {renderTemplateVisual(tmpl.slug)}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-surface/90 text-primary border border-border backdrop-blur-xs shadow-xs">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Konten Card: Nama, Deskripsi Singkat, & Tombol Lihat Demo */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {tmpl.description || 'Desain undangan premium dengan estetika terkurasi.'}
                      </p>
                    </div>

                    <div className="pt-2">
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

      {/* Navigasi Carousel: Tombol Prev / Next & Pagination Dots */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Halaman carousel template">
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
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-border hover:bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Previous and Next Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Template sebelumnya"
            className="w-11 h-11 rounded-full border border-border bg-surface hover:bg-surface-elevated text-text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-xs font-medium text-text-muted font-mono px-1">
            {currentIndex + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Template berikutnya"
            className="w-11 h-11 rounded-full border border-border bg-surface hover:bg-surface-elevated text-text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
