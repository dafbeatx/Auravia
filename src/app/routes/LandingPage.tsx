import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DecorativeDivider, MonogramFrame } from '@/components/template/ornaments';

export function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'cover' | 'couple' | 'event' | 'gallery' | 'rsvp'>('cover');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Monitor scroll untuk efek visual halus pada sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup menu seluler saat tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const navLinks = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Template', href: '#template' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] selection:bg-[#D4AF37]/25 antialiased font-sans flex flex-col">
      {/* ================================================================== */}
      {/* SECTION 1: NAVBAR                                                  */}
      {/* ================================================================== */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF9F6]/95 backdrop-blur-md shadow-xs border-b border-[#E7E5E0]'
            : 'bg-[#FAF9F6] border-b border-[#E7E5E0]/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] rounded-lg py-1"
            aria-label="Aurovia Beranda"
          >
            <img src="/logo.svg" alt="Aurovia" className="h-8 w-auto object-contain" />
            <span className="font-serif text-2xl font-bold tracking-wider text-[#1C1917]">
              AUROVIA
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide uppercase text-[#78716C]" aria-label="Menu Utama">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#1C1917] transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="text-xs font-semibold text-[#1C1917] bg-[#E7E5E0] hover:bg-[#DEDCD5] px-4 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer shadow-2xs"
              >
                Ke Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#78716C] hover:text-[#1C1917] px-4 py-2.5 rounded-full transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] px-5 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                >
                  Mulai Buat Undangan
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Tutup navigasi menu' : 'Buka navigasi menu'}
              className="p-2.5 rounded-lg border border-[#E7E5E0] bg-[#FAF9F6] text-[#1C1917] hover:bg-[#F5F4F0] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E7E5E0] bg-[#FAF9F6] px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1" aria-label="Menu Seluler">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-sm font-semibold text-[#1C1917] hover:bg-[#F5F4F0] transition-colors min-h-[44px] flex items-center"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-[#E7E5E0] flex flex-col gap-2.5">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-xs font-semibold bg-[#1C1917] text-[#FAF9F6] py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center"
                >
                  Ke Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-semibold text-[#1C1917] border border-[#E7E5E0] bg-[#FAF9F6] hover:bg-[#F5F4F0] py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-semibold bg-[#1C1917] text-[#FAF9F6] py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center shadow-xs"
                  >
                    Mulai Buat Undangan
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ================================================================== */}
        {/* SECTION 2: HERO                                                    */}
        {/* ================================================================== */}
        <section id="hero" className="pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Kiri: Copywriting & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#1C1917] text-[11px] font-semibold tracking-wider uppercase">
                <span className="text-[#D4AF37]">✦</span>
                <span>Platform Undangan Pernikahan Digital</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-[#1C1917]">
                Undangan Digital yang Dirancang untuk Momen yang Berarti
              </h1>

              <p className="text-base sm:text-lg text-[#78716C] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Buat undangan pernikahan digital yang elegan, personal, dan mudah dibagikan.
                Pilih desain, isi cerita Anda, lalu bagikan kepada orang-orang terdekat.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] text-sm font-semibold tracking-wide transition-all shadow-md active:scale-98 min-h-[48px]"
                >
                  Mulai Buat Undangan
                </Link>

                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#E7E5E0] bg-[#FAF9F6] hover:bg-[#F5F4F0] text-[#1C1917] text-sm font-semibold tracking-wide transition-all min-h-[48px]"
                >
                  Lihat Template
                </Link>
              </div>

              <p className="text-xs text-[#78716C]/80 tracking-wide">
                Gratis untuk mulai membuat &bull; Tanpa komitmen di awal
              </p>
            </div>

            {/* Kolom Kanan: Visual Preview Representatif Dua Template Nyata */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-sm sm:max-w-md relative">
                {/* Background Shadow Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/15 to-[#1E3A5F]/15 rounded-3xl blur-2xl transform -rotate-3" />

                {/* Kartu Pratinjau Tumpuk (Classic Elegance & Royal Navy & Gold) */}
                <div className="relative space-y-4">
                  {/* Kartu 1: Royal Navy & Gold Mockup */}
                  <div className="p-6 rounded-2xl border border-[#D4AF37]/50 bg-[#0A1324] text-[#F8FAFC] shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                        Walimatul &apos;Ursy
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/40 bg-[#1E3A5F] text-[#D4AF37]">
                        Royal Navy &amp; Gold
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-2">
                      <MonogramFrame initials="R & D" variant="royal-circle" />
                      <h2 className="font-serif text-2xl font-normal text-[#D4AF37] pt-1">
                        Rika &amp; Dani
                      </h2>
                      <p className="text-xs text-[#F8FAFC]/80">
                        Sabtu, 15 Oktober 2026 &bull; Jakarta
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-1">
                      {['32 Hari', '08 Jam', '45 Mnt', '12 Dtk'].map((t, i) => (
                        <div key={i} className="p-2 rounded-lg border border-[#D4AF37]/30 bg-[#1E3A5F]/60 text-[10px] text-[#D4AF37]">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kartu 2: Classic Elegance Inset Strip */}
                  <div className="p-5 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] text-[#1C1917] shadow-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-[#E7E5E0] bg-[#FAF9F6] flex items-center justify-center font-serif text-sm font-semibold text-[#1C1917]">
                        S &amp; D
                      </div>
                      <div>
                        <p className="font-serif text-base font-medium text-[#1C1917]">
                          Sarah &amp; Dimas
                        </p>
                        <p className="text-[11px] text-[#78716C]">
                          Classic Elegance &bull; Tipografi Editorial
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#1C1917] px-3 py-1.5 rounded-full border border-[#E7E5E0] bg-[#FAF9F6]">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 3: TRUST / VALUE STRIP                                     */}
        {/* ================================================================== */}
        <section className="border-y border-[#E7E5E0] bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <p className="text-center text-xs font-semibold tracking-widest uppercase text-[#78716C]">
              Dirancang untuk membuat proses undangan terasa lebih sederhana
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-[#1C1917]">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                  Desain Elegan
                </h2>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Tipografi berkelas dan harmoni warna yang disusun oleh desainer.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-[#1C1917]">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                  Mudah Dipersonalisasi
                </h2>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Sesuaikan kisah, foto, agenda acara, dan musik latar Anda.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-[#1C1917]">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                  Dibagikan Secara Digital
                </h2>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Tautan instan ramah ponsel yang mudah dikirimkan melalui WhatsApp.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-[#1C1917]">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                  Terintegrasi RSVP
                </h2>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Rekap kehadiran tamu dan buku ucapan doa restu yang terstruktur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 4: TEMPLATE SHOWCASE                                       */}
        {/* ================================================================== */}
        <section id="template" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Katalog Pilihan
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
              Temukan Desain yang Sesuai dengan Cerita Anda
            </h2>
            <DecorativeDivider variant="diamond" withLine={false} />
            <p className="text-sm text-[#78716C] leading-relaxed">
              Setiap template dibangun di atas arsitektur Aurovia dengan dukungan multi-acara,
              cover envelope interaktif, galeri foto, dan pemutar musik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Template Card 1: Classic Elegance */}
            <div className="rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="p-8 border-b border-[#E7E5E0] bg-[#FAF9F6] text-center space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[#78716C] font-semibold uppercase tracking-wider">
                  <span>Pernikahan</span>
                  <span>Editorial Serif</span>
                </div>

                <div className="py-8 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[#78716C]">
                    The Wedding Of
                  </p>
                  <p className="font-serif text-3xl text-[#1C1917] font-normal">
                    Sarah &amp; Dimas
                  </p>
                  <p className="text-xs text-[#78716C] italic font-serif">
                    Minggu, 20 November 2026
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-block text-[11px] font-mono px-3 py-1 rounded-full border border-[#E7E5E0] bg-[#FFFFFF] text-[#78716C]">
                    Warm Alabaster &bull; Cormorant Garamond
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#1C1917]">
                    Classic Elegance
                  </h3>
                  <p className="text-xs text-[#78716C] leading-relaxed mt-1">
                    Nuansa editorial abadi dengan tipografi serif hangat, tata letak seimbang, dan ruang baca yang menenangkan.
                  </p>
                </div>

                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-[#1C1917] text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAF9F6] text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px]"
                >
                  Lihat Demo
                </Link>
              </div>
            </div>

            {/* Template Card 2: Royal Navy & Gold */}
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#0A1324] text-[#F8FAFC] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="p-8 border-b border-[#D4AF37]/30 bg-[#132238]/60 text-center space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider">
                  <span>Pernikahan</span>
                  <span>Modern Islamic</span>
                </div>

                <div className="py-8 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[#D4AF37]">
                    Walimatul &apos;Ursy
                  </p>
                  <p className="font-serif text-3xl text-[#D4AF37] font-normal">
                    Rika &amp; Dani
                  </p>
                  <p className="text-xs text-[#F8FAFC]/80 font-serif">
                    Sabtu, 15 Oktober 2026
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-block text-[11px] font-mono px-3 py-1 rounded-full border border-[#D4AF37]/40 bg-[#0A1324] text-[#D4AF37]">
                    Royal Navy &bull; Gold Accent &bull; Playfair
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#D4AF37]">
                    Royal Navy &amp; Gold
                  </h3>
                  <p className="text-xs text-[#F8FAFC]/75 leading-relaxed mt-1">
                    Kemegahan modern bernuansa navy kerajaan dengan aksen emas berkelas, kartu glass, dan estetika pernikahan khidmat.
                  </p>
                </div>

                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A1324] text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px]"
                >
                  Lihat Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 5: FITUR UTAMA                                             */}
        {/* ================================================================== */}
        <section id="fitur" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E7E5E0] space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
              Kemampuan Platform
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
              Semua yang Dibutuhkan untuk Satu Undangan
            </h2>
            <DecorativeDivider variant="diamond" withLine={false} />
            <p className="text-sm text-[#78716C] leading-relaxed">
              Seluruh komponen dirancang untuk memberikan kemudahan bagi Anda dan pengalaman berkesan bagi para tamu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                title: 'Hero & Cover',
                desc: 'Pengalaman pembuka sampul elegan (Cover Envelope) dengan sapaan nama tamu yang dipersonalisasi.',
                icon: '✦',
              },
              {
                title: 'Profil Mempelai',
                desc: 'Tampilkan nama kedua calon mempelai, peran keluarga, nama orang tua, serta foto portrait berbingkai anggun.',
                icon: '✦',
              },
              {
                title: 'Kisah Kami',
                desc: 'Bagikan momen perjalanan cinta Anda melalui linimasa cerita yang dapat diatur urutannya secara fleksibel.',
                icon: '✦',
              },
              {
                title: 'Agenda Acara',
                desc: 'Mendukung beberapa rangkaian agenda seperti akad nikah, pemberkatan, dan resepsi lengkap dengan tombol Google Maps.',
                icon: '✦',
              },
              {
                title: 'Galeri Foto',
                desc: 'Dokumentasi momen pre-wedding dengan integrasi Supabase Storage dan penampil lightbox layar penuh.',
                icon: '✦',
              },
              {
                title: 'RSVP Digital',
                desc: 'Tamu dapat mengonfirmasi kehadiran serta jumlah orang yang hadir secara real-time langsung ke dashboard Anda.',
                icon: '✦',
              },
              {
                title: 'Doa & Ucapan',
                desc: 'Buku tamu digital interaktif tempat para tamu menuliskan doa restu dan harapan terbaik bagi kedua mempelai.',
                icon: '✦',
              },
              {
                title: 'Amplop Digital',
                desc: 'Informasi nomor rekening bank dan dompet digital tanda kasih dilengkapi tombol salin satu sentuhan.',
                icon: '✦',
              },
              {
                title: 'Musik Latar',
                desc: 'Pemutar musik floating yang memutar alunan lagu favorit secara otomatis setelah interaksi pembuka oleh tamu.',
                icon: '✦',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-3 shadow-2xs hover:border-[#D4AF37]/60 transition-colors"
              >
                <span className="text-base text-[#D4AF37] block font-mono">{f.icon}</span>
                <h3 className="font-serif text-lg font-medium text-[#1C1917]">
                  {f.title}
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 6: PREVIEW "HOW IT LOOKS"                                  */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5F4F0] border-y border-[#E7E5E0]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
                Tampilan Layar Ponsel
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
                Pengalaman Responsif di Genggaman Tamu
              </h2>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Mayoritas tamu membuka undangan melalui ponsel pintar. Lihat bagaimana undangan Aurovia tampil anggun di layar seluler.
              </p>

              {/* Selector Tab Pratinjau Bagian */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
                {[
                  { id: 'cover', label: 'Sampul Pembuka' },
                  { id: 'couple', label: 'Profil Mempelai' },
                  { id: 'event', label: 'Rangkaian Acara' },
                  { id: 'gallery', label: 'Galeri Foto' },
                  { id: 'rsvp', label: 'RSVP & Ucapan' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePreviewTab(tab.id as typeof activePreviewTab)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all min-h-[44px] cursor-pointer ${
                      activePreviewTab === tab.id
                        ? 'bg-[#1C1917] text-[#FAF9F6] shadow-xs'
                        : 'bg-[#FFFFFF] border border-[#E7E5E0] text-[#78716C] hover:text-[#1C1917]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="max-w-xs sm:max-w-sm mx-auto">
              <div className="relative rounded-[40px] border-4 border-[#1C1917] bg-[#1C1917] p-2 shadow-2xl">
                {/* Speaker Notch */}
                <div className="w-24 h-4 bg-[#1C1917] rounded-b-xl mx-auto absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-[#292524] rounded-full" />
                </div>

                {/* Layar Ponsel Internal */}
                <div className="w-full h-[520px] rounded-[32px] bg-[#FAF9F6] overflow-y-auto pt-8 pb-6 px-4 text-center space-y-6 text-[#1C1917] select-none">
                  {activePreviewTab === 'cover' && (
                    <div className="space-y-6 my-auto pt-6">
                      <DecorativeDivider variant="diamond" withLine={false} />
                      <p className="text-[10px] uppercase tracking-widest text-[#78716C]">
                        The Wedding Of
                      </p>
                      <h3 className="font-serif text-3xl font-normal text-[#1C1917]">
                        Sarah &amp; Dimas
                      </h3>
                      <div className="p-3 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] max-w-[200px] mx-auto text-[10px]">
                        <span className="text-[#78716C] block">Kepada Yth.</span>
                        <span className="font-semibold text-[#1C1917]">Bapak Anugrah &amp; Partner</span>
                      </div>
                      <button
                        type="button"
                        className="px-6 py-2.5 rounded-full bg-[#1C1917] text-[#FAF9F6] text-xs font-semibold shadow-xs"
                      >
                        Buka Undangan
                      </button>
                    </div>
                  )}

                  {activePreviewTab === 'couple' && (
                    <div className="space-y-4 pt-4">
                      <h3 className="font-serif text-xl font-normal text-[#1C1917]">
                        Kedua Mempelai
                      </h3>
                      <DecorativeDivider variant="diamond" withLine={false} />
                      <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2">
                        <div className="w-12 h-12 rounded-full border border-[#D4AF37] mx-auto flex items-center justify-center font-serif text-base font-bold text-[#1C1917]">
                          S
                        </div>
                        <p className="font-serif text-base font-semibold text-[#1C1917]">
                          Sarah Anindita
                        </p>
                        <p className="text-[10px] text-[#78716C]">
                          Putri pertama dari Bpk. Bambang &amp; Ibu Maria
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2">
                        <div className="w-12 h-12 rounded-full border border-[#D4AF37] mx-auto flex items-center justify-center font-serif text-base font-bold text-[#1C1917]">
                          D
                        </div>
                        <p className="font-serif text-base font-semibold text-[#1C1917]">
                          Dimas Prasetyo
                        </p>
                        <p className="text-[10px] text-[#78716C]">
                          Putra kedua dari Bpk. Hartono &amp; Ibu Ratna
                        </p>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'event' && (
                    <div className="space-y-4 pt-4">
                      <h3 className="font-serif text-xl font-normal text-[#1C1917]">
                        Agenda Acara
                      </h3>
                      <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] text-left space-y-2">
                        <div className="flex justify-between items-center border-b border-[#E7E5E0] pb-2">
                          <span className="font-semibold text-xs text-[#1C1917]">Akad Nikah</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#1C1917] font-semibold">
                            Utama
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#D4AF37]">
                          Minggu, 20 November 2026
                        </p>
                        <p className="text-[10px] text-[#78716C]">
                          Pukul 08.00 - 10.00 WIB
                        </p>
                        <p className="text-[11px] font-semibold text-[#1C1917]">
                          Hotel Mulia Senayan, Jakarta
                        </p>
                        <span className="inline-block text-[10px] font-semibold text-[#1C1917] underline pt-1">
                          Buka Google Maps &rarr;
                        </span>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'gallery' && (
                    <div className="space-y-4 pt-4">
                      <h3 className="font-serif text-xl font-normal text-[#1C1917]">
                        Galeri Foto
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-lg border border-[#E7E5E0] bg-[#E7E5E0]/60 flex items-center justify-center text-[10px] text-[#78716C]"
                          >
                            Foto Dokumentasi
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'rsvp' && (
                    <div className="space-y-4 pt-4">
                      <h3 className="font-serif text-xl font-normal text-[#1C1917]">
                        Konfirmasi Kehadiran
                      </h3>
                      <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] text-left space-y-2">
                        <div className="text-[10px] space-y-1">
                          <span className="text-[#78716C] block">Nama Anda</span>
                          <div className="p-2 rounded border border-[#E7E5E0] bg-[#FAF9F6] text-[#1C1917]">
                            Anugrah &amp; Partner
                          </div>
                        </div>
                        <div className="text-[10px] space-y-1 pt-1">
                          <span className="text-[#78716C] block">Kehadiran</span>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 rounded bg-[#1C1917] text-[#FAF9F6]">Hadir</span>
                            <span className="px-3 py-1 rounded border border-[#E7E5E0]">Maaf, Berhalangan</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="w-full py-2 bg-[#1C1917] text-[#FAF9F6] text-[10px] rounded font-semibold mt-2"
                        >
                          Kirim Konfirmasi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-8">
                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#1C1917] text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FAF9F6] text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px]"
                >
                  Lihat Semua Template
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 7: CARA KERJA                                              */}
        {/* ================================================================== */}
        <section id="cara-kerja" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
              Alur Pembuatan
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
              Alur Pembuatan yang Mudah dan Terstruktur
            </h2>
            <DecorativeDivider variant="diamond" withLine={false} />
            <p className="text-sm text-[#78716C] leading-relaxed">
              Lima langkah terarah dari memilih desain hingga undangan siap dibagikan kepada keluarga dan kerabat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Pilih Desain',
                desc: 'Pilih salah satu template master seperti Classic Elegance atau Royal Navy & Gold.',
              },
              {
                step: '02',
                title: 'Isi Informasi',
                desc: 'Masukkan rincian calon pengantin, tanggal, rangkaian acara, dan lokasi Google Maps.',
              },
              {
                step: '03',
                title: 'Personalisasi',
                desc: 'Sesuaikan kisah cinta, galeri foto, musik latar, serta rekening tanda kasih.',
              },
              {
                step: '04',
                title: 'Publikasikan',
                desc: 'Pratinjau hasil secara langsung lalu terbitkan undangan Anda dengan satu klik.',
              },
              {
                step: '05',
                title: 'Bagikan ke Tamu',
                desc: 'Buat tautan personal per tamu dan bagikan melalui WhatsApp secara cepat dan rapi.',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-3 shadow-2xs relative"
              >
                <span className="font-serif text-3xl font-light text-[#D4AF37] block">
                  {s.step}
                </span>
                <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                  {s.title}
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 8: PERSONALISASI                                           */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-y border-[#E7E5E0]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                Sentuhan Pribadi
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal leading-tight">
                Template adalah awal. Cerita Anda yang membuatnya berbeda.
              </h2>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Aurovia memberikan keleluasaan penuh untuk menyesuaikan setiap detail tanpa merusak keindahan tata letak desain asli.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] space-y-1">
                  <span className="font-semibold text-[#1C1917]">Nama &amp; Peran Pasangan</span>
                  <p className="text-[#78716C]">Atur panggilan, urutan nama mempelai, serta silsilah keluarga.</p>
                </div>
                <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] space-y-1">
                  <span className="font-semibold text-[#1C1917]">Multiple Agenda</span>
                  <p className="text-[#78716C]">Dukung akad, resepsi, atau syukuran dengan zona waktu mandiri.</p>
                </div>
                <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] space-y-1">
                  <span className="font-semibold text-[#1C1917]">Penyimpanan Foto Asli</span>
                  <p className="text-[#78716C]">Unggah langsung momen terbaik Anda tanpa kompresi berlebih.</p>
                </div>
                <div className="p-4 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] space-y-1">
                  <span className="font-semibold text-[#1C1917]">Batas Tamu &amp; RSVP</span>
                  <p className="text-[#78716C]">Kendalikan kapasitas kehadiran tamu per undangan secara terukur.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="p-6 sm:p-8 rounded-2xl border border-[#E7E5E0] bg-[#FAF9F6] shadow-md max-w-lg w-full space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E5E0] pb-3 text-xs text-[#78716C]">
                  <span className="font-semibold text-[#1C1917]">Editor Undangan Aurovia</span>
                  <span>Draft Lokal Instan</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FFFFFF] flex justify-between items-center">
                    <span>Seksi Sampul Pembuka (Cover)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Aktif</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FFFFFF] flex justify-between items-center">
                    <span>Seksi Kedua Mempelai (Hosts)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Aktif</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FFFFFF] flex justify-between items-center">
                    <span>Agenda Acara Utama (Events)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Aktif</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#E7E5E0] bg-[#FFFFFF] flex justify-between items-center">
                    <span>Amplop Digital &amp; Tanda Kasih</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Aktif</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#78716C] italic text-center pt-2">
                  Pratinjau langsung diperbarui seketika tanpa request database berulang.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 9: TRUST & SECURITY                                        */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
              Keamanan &amp; Privasi
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
              Data Undangan Anda Tetap Terjaga
            </h2>
            <DecorativeDivider variant="diamond" withLine={false} />
            <p className="text-sm text-[#78716C] leading-relaxed">
              Kami memegang prinsip keamanan multi-tenant yang ketat agar privasi momen sakral Anda terlindungi secara menyeluruh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2.5">
              <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                Autentikasi Akun
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Akses editor hanya dapat dibuka oleh pemilik akun yang sah melalui sesi terverifikasi.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2.5">
              <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                Isolasi Data RLS
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Tiap baris data undangan dilindungi oleh PostgreSQL Row-Level Security di level database.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2.5">
              <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                Penyimpanan Aman
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Berkas foto galeri dan pasangan disimpan pada direktori cloud terisolasi per pemilik akun.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] space-y-2.5">
              <h3 className="font-serif text-base font-semibold text-[#1C1917]">
                Draft Bersifat Privat
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Undangan tidak akan dapat diakses oleh publik sebelum Anda sendiri yang mempublikasikannya.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 10: FAQ                                                    */}
        {/* ================================================================== */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5F4F0] border-t border-[#E7E5E0]">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
                Pertanyaan Umum
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1917] font-normal">
                Pertanyaan yang Sering Diajukan
              </h2>
              <DecorativeDivider variant="diamond" withLine={false} />
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'Apa itu Aurovia?',
                  a: 'Aurovia adalah platform pembuatan dan distribusi undangan pernikahan digital modern yang berfokus pada keindahan estetika editorial, kemudahan personalisasi, dan kenyamanan tamu undangan.',
                },
                {
                  q: 'Apakah saya harus membuat akun?',
                  a: 'Ya, Anda cukup mendaftar akun gratis menggunakan email untuk mulai membuat draf undangan, memilih desain template, dan mengatur data acara Anda secara aman.',
                },
                {
                  q: 'Apakah saya bisa melihat template terlebih dahulu?',
                  a: 'Tentu. Anda dapat melihat pratinjau visual template di halaman ini. Untuk mencoba interaktivitas dan menjelajahi editor, silakan masuk ke akun Anda.',
                },
                {
                  q: 'Apakah undangan bisa dibagikan melalui WhatsApp?',
                  a: 'Bisa. Setelah undangan dipublikasikan, Anda akan memperoleh tautan unik resmi yang dapat langsung dikirimkan melalui WhatsApp, Instagram, maupun pesan teks.',
                },
                {
                  q: 'Apakah bisa menggunakan foto sendiri?',
                  a: 'Bisa. Anda dapat mengunggah foto kedua mempelai serta foto dokumentasi acara langsung ke seksi galeri foto melalui media penyimpanan cloud Aurovia.',
                },
                {
                  q: 'Apakah bisa memiliki beberapa acara?',
                  a: 'Bisa. Aurovia mendukung pencatatan beberapa agenda sekaligus, seperti Akad Nikah, Pemberkatan, Resepsi, atau Syukuran, lengkap dengan penunjuk waktu dan peta Google Maps.',
                },
                {
                  q: 'Apakah tamu bisa melakukan RSVP?',
                  a: 'Bisa. Tamu undangan dapat mengonfirmasi kehadiran serta jumlah orang yang hadir langsung di undangan, dan Anda dapat memantau rekap konfirmasi kehadiran tersebut di dashboard.',
                },
                {
                  q: 'Apakah undangan dapat diedit setelah dibuat?',
                  a: 'Tentu. Anda dapat memperbarui informasi waktu, lokasi, foto, teks, maupun urutan seksi kapan saja melalui editor undangan bahkan setelah undangan dipublikasikan.',
                },
              ].map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-serif text-base font-medium text-[#1C1917] hover:bg-[#FAF9F6] transition-colors min-h-[44px] cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-sm font-sans text-[#78716C] transform transition-transform duration-200">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs text-[#78716C] leading-relaxed border-t border-[#E7E5E0]/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 11: FINAL CTA                                              */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl sm:text-5xl text-[#1C1917] font-normal leading-tight">
              Siap Membuat Undangan Anda?
            </h2>
            <p className="text-sm sm:text-base text-[#78716C] leading-relaxed">
              Mulai buat undangan pernikahan digital Anda sekarang dan bagikan momen bahagia bersama keluarga serta sahabat terdekat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] text-sm font-semibold tracking-wide transition-all shadow-md active:scale-98 min-h-[48px]"
            >
              Mulai Buat Undangan
            </Link>

            <Link
              to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-[#E7E5E0] bg-[#FAF9F6] hover:bg-[#F5F4F0] text-[#1C1917] text-sm font-semibold tracking-wide transition-all min-h-[48px]"
            >
              Lihat Template
            </Link>
          </div>
        </section>
      </main>

      {/* ================================================================== */}
      {/* SECTION 12: FOOTER                                                 */}
      {/* ================================================================== */}
      <footer className="border-t border-[#E7E5E0] bg-[#FFFFFF] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#E7E5E0]">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Aurovia" className="h-7 w-auto object-contain" />
              <span className="font-serif text-xl font-bold tracking-wider text-[#1C1917]">
                AUROVIA
              </span>
            </div>
            <p className="text-xs text-[#78716C] max-w-sm leading-relaxed">
              Platform undangan digital terstruktur. Dirancang dengan pendekatan tipografi editorial dan keandalan sistem cloud modern.
            </p>
          </div>

          {/* Navigasi Platform */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Navigasi
            </p>
            <ul className="space-y-2 text-xs text-[#78716C]">
              <li>
                <a href="#hero" className="hover:text-[#1C1917] transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#template" className="hover:text-[#1C1917] transition-colors">
                  Template
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-[#1C1917] transition-colors">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="hover:text-[#1C1917] transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#1C1917] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Akses Akun */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Akun
            </p>
            <ul className="space-y-2 text-xs text-[#78716C]">
              <li>
                <Link to="/login" className="hover:text-[#1C1917] transition-colors">
                  Masuk
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#1C1917] transition-colors">
                  Daftar
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#1C1917] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#78716C]">
          <p>&copy; 2026 Aurovia. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono text-[10px]">AUROVIA &bull; ELEGANT DIGITAL INVITATION PLATFORM</p>
        </div>
      </footer>
    </div>
  );
}
