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
    { label: 'Fitur', href: '#fitur' },
    { label: 'Template', href: '#template' },
    { label: 'Cara Kerja', href: '#cara-kerja' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-accent-light/30 antialiased font-sans flex flex-col">
      {/* ================================================================== */}
      {/* HEADER: NAVBAR STICKY                                              */}
      {/* ================================================================== */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-xs border-b border-border'
            : 'bg-background border-b border-border/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo Brand: logo.svg langsung tanpa teks duplikat */}
          <Link
            to="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 hover:opacity-90 transition-opacity"
            aria-label="Aurovia Beranda"
          >
            <img src="/logo.svg" alt="Aurovia" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide uppercase text-text-muted" aria-label="Menu Utama">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-primary transition-colors py-2"
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
                className="text-xs font-semibold text-primary bg-primary-soft hover:bg-secondary/15 px-4 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer border border-secondary/30"
              >
                Ke Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-text-muted hover:text-primary px-4 py-2.5 rounded-full transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
                >
                  Masuk
                </Link>
                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer shadow-xs active:scale-98"
                >
                  Buat Undangan
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
              className="p-2.5 rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fadeIn">
            <nav className="flex flex-col space-y-1" aria-label="Menu Seluler">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] flex items-center"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-border flex flex-col gap-2.5">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-xs font-semibold bg-primary text-primary-foreground py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center"
                >
                  Ke Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-semibold border border-border bg-surface text-text-primary py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-semibold bg-primary text-primary-foreground py-3 px-4 rounded-xl min-h-[44px] flex items-center justify-center shadow-xs"
                  >
                    Buat Undangan
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================================================================== */}
      {/* 1. HERO SECTION                                                    */}
      {/* ================================================================== */}
      <main className="flex-1">
        <section id="hero" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Teks Hero */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold tracking-wider uppercase text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Platform Undangan Digital Terstruktur
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-text-primary tracking-tight leading-[1.15]">
                Undangan Digital yang Dibuat untuk Momen yang Berarti.
              </h1>

              <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-normal">
                Buat undangan pernikahan digital yang elegan, personal, dan mudah dibagikan. Pilih desain, isi cerita Anda, lalu bagikan kepada orang-orang terdekat dengan tenang.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98 min-h-[48px]"
                >
                  Mulai Buat Undangan
                </Link>

                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-secondary text-primary bg-primary-soft hover:bg-secondary/15 text-sm font-semibold tracking-wide transition-all min-h-[48px]"
                >
                  Lihat Template
                </Link>
              </div>

              <p className="text-xs text-text-subtle pt-1 font-sans">
                Gratis untuk mulai membuat &bull; Draf tersimpan privat
              </p>

              {/* Trust Signals Strip */}
              <div className="pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center lg:text-left">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">Tanpa instalasi</p>
                  <p className="text-[11px] text-text-subtle">Langsung buka di browser</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">Responsif perangkat</p>
                  <p className="text-[11px] text-text-subtle">Sempurna di ponsel & laptop</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">Mudah dibagikan</p>
                  <p className="text-[11px] text-text-subtle">Tautan personal WhatsApp</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-text-primary">Dapat disesuaikan</p>
                  <p className="text-[11px] text-text-subtle">Kisah, galeri, & musik</p>
                </div>
              </div>
            </div>

            {/* Kolom Visual Hero: Mockup Undangan Nyata */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Background Glow Elegan */}
                <div className="absolute -inset-4 bg-accent-light/25 rounded-3xl blur-2xl -z-10" />

                {/* Komposisi Desain: Pratinjau Desain Nyata Aurovia */}
                <div className="space-y-4">
                  {/* Kartu 1: Royal Navy & Gold Inset Preview */}
                  <div className="p-6 sm:p-7 rounded-2xl border border-[#D4AF37]/35 bg-[#0F1E36] text-[#F8FAFC] shadow-xl space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                        The Wedding Celebration
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
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
                  <div className="p-5 rounded-2xl border border-border bg-surface text-text-primary shadow-md flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center font-serif text-sm font-semibold text-primary">
                        S &amp; D
                      </div>
                      <div>
                        <p className="font-serif text-base font-medium text-text-primary">
                          Sarah &amp; Dimas
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Classic Elegance &bull; Tipografi Editorial
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-full border border-secondary/30 bg-primary-soft">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 2. TRUST / VALUE PROPOSITION STRIP                                 */}
        {/* ================================================================== */}
        <section className="border-y border-border bg-surface py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <p className="text-center text-xs font-semibold tracking-widest uppercase text-text-muted">
              Dirancang untuk membuat proses undangan terasa lebih sederhana
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-secondary">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Desain Elegan
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tipografi berkelas dan harmoni warna yang disusun secara estetik.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-secondary">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Mudah Dipersonalisasi
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Sesuaikan kisah, foto, agenda acara, dan musik latar Anda.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-secondary">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Dibagikan Secara Digital
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tautan khusus per tamu untuk pengiriman rapi lewat WhatsApp.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-secondary">✦</span>
                <h2 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Terintegrasi RSVP
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Rekap konfirmasi kehadiran tamu tercatat langsung di dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 3. KENAPA AUROVIA                                                  */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
              Kelebihan Platform
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
              Kenapa Memilih Aurovia?
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Kami memadukan estetika desain editorial dengan arsitektur cloud modern untuk momen terbaik hidup Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-surface space-y-3 hover:border-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-serif text-lg font-bold">
                01
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Tipografi Editorial
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bukan sekadar form isian generik. Tata letak setiap halaman dipersiapkan dengan ritme tipografi yang menawan.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-surface space-y-3 hover:border-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-serif text-lg font-bold">
                02
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Tautan Personal Tamu
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Sapa setiap sahabat dan keluarga dengan nama mereka pada sampul amplop digital saat tautan dibuka.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-surface space-y-3 hover:border-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-serif text-lg font-bold">
                03
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Privasi Data Terjamin
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Draf undangan bersifat privat dengan PostgreSQL Row-Level Security, tidak dapat diintip sebelum dipublikasikan.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-surface space-y-3 hover:border-secondary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-serif text-lg font-bold">
                04
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Cepat &amp; Bebas Iklan
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Tamu dapat membuka undangan tanpa hambatan, tanpa unduh aplikasi, dan tanpa gangguan iklan pihak ketiga.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 4. FITUR UTAMA                                                     */}
        {/* ================================================================== */}
        <section id="fitur" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Struktur Undangan
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Semua yang Dibutuhkan untuk Satu Undangan
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Setiap seksi dirancang secara modular agar undangan pernikahan Anda menyampaikan cerita dengan utuh dan anggun.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  title: 'Hero & Cover',
                  desc: 'Personal branding dengan amplop interaktif dan nama tamu undangan pada sampul pembuka.',
                  icon: '✉',
                },
                {
                  title: 'Profil Mempelai',
                  desc: 'Informasi kedua mempelai, foto pasangan, nama orang tua, serta tautan media sosial keluarga.',
                  icon: '❦',
                },
                {
                  title: 'Kisah Kami',
                  desc: 'Perjalanan cinta pasangan mulai dari pertemuan pertama, momen lamaran, hingga menuju hari bahagia.',
                  icon: '📖',
                },
                {
                  title: 'Agenda Acara',
                  desc: 'Dukungan beberapa rangkaian acara seperti akad nikah, pemberkatan, resepsi, peta lokasi Google Maps, dan tombol kalender.',
                  icon: '📅',
                },
                {
                  title: 'Galeri Foto',
                  desc: 'Koleksi foto pre-wedding beresolusi tinggi dengan sistem penyimpanan Supabase Storage terisolasi.',
                  icon: '🖼',
                },
                {
                  title: 'RSVP Digital',
                  desc: 'Konfirmasi kehadiran dan jumlah tamu undangan yang terhubung langsung ke dashboard pengelola.',
                  icon: '✓',
                },
                {
                  title: 'Doa & Ucapan',
                  desc: 'Buku tamu digital interaktif tempat keluarga dan sahabat meninggalkan doa restu.',
                  icon: '✍',
                },
                {
                  title: 'Amplop Digital',
                  desc: 'Informasi nomor rekening bank dan dompet digital yang rapi untuk tanda kasih tanpa tunai.',
                  icon: '💳',
                },
                {
                  title: 'Musik Latar',
                  desc: 'Pemutar musik mengambang dengan kontrol putar dan jeda otomatis demi kenyamanan tamu.',
                  icon: '♫',
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl border border-border bg-background/50 hover:bg-background transition-colors space-y-2.5"
                >
                  <span className="text-xl text-primary font-serif block">{feat.icon}</span>
                  <h3 className="font-serif text-lg font-semibold text-text-primary">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 5. TEMPLATE SHOWCASE: PILIH GAYA UNDANGANMU                        */}
        {/* ================================================================== */}
        <section id="template" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
              Katalog Desain
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
              Pilih Gaya Undanganmu
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Jelajahi template master yang tersedia di sistem Aurovia. Masuk ke akun Anda untuk mencoba demo interaktifnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Card Template 1: Classic Elegance */}
            <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                {/* Visual Preview */}
                <div className="h-64 sm:h-72 bg-[#FAF9F6] border-b border-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="space-y-3 max-w-xs">
                    <span className="text-[10px] uppercase tracking-widest text-text-subtle font-semibold">
                      Editorial Monogram
                    </span>
                    <div className="w-12 h-12 mx-auto rounded-full border border-border bg-surface flex items-center justify-center font-serif text-base font-semibold text-primary">
                      A &bull; B
                    </div>
                    <p className="font-serif text-2xl font-normal text-text-primary">
                      Aditya &amp; Bella
                    </p>
                    <p className="text-xs text-text-muted">
                      Minggu, 20 Desember 2026
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                      Classic Elegance
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-surface-elevated text-text-muted">
                      Editorial &bull; Minimalis
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    Desain abadi dengan tipografi serif editorial bergaya majalah, spasi yang tenang, dan ornamen garis klasik yang anggun.
                  </p>
                  <p className="text-[11px] text-text-subtle font-medium">
                    Warna dominan: Warm Alabaster, Deep Bronze &amp; Stone
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0">
                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl border border-secondary text-primary bg-primary-soft hover:bg-secondary/15 text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px]"
                >
                  Lihat Demo
                </Link>
              </div>
            </div>

            {/* Card Template 2: Royal Navy & Gold */}
            <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                {/* Visual Preview */}
                <div className="h-64 sm:h-72 bg-[#0B1528] border-b border-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="space-y-3 max-w-xs text-[#F8FAFC]">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                      Islamic Luxury
                    </span>
                    <MonogramFrame initials="R & D" variant="royal-circle" />
                    <p className="font-serif text-2xl font-normal text-[#D4AF37]">
                      Rika &amp; Dani
                    </p>
                    <p className="text-xs text-[#F8FAFC]/75">
                      Sabtu, 15 Oktober 2026
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-text-primary">
                      Royal Navy &amp; Gold
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-surface-elevated text-text-muted">
                      Luxury &bull; Royal Navy
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    Terinspirasi dari perayaan sakral dengan palet biru malam dan aksen emas metalik, ornamen monogram cincin, serta seksi kutipan Islami.
                  </p>
                  <p className="text-[11px] text-text-subtle font-medium">
                    Warna dominan: Royal Navy, Gold Metalik &amp; Glass
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 pt-0">
                <Link
                  to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                  className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl border border-secondary text-primary bg-primary-soft hover:bg-secondary/15 text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px]"
                >
                  Lihat Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 6. CARA KERJA 3 LANGKAH                                            */}
        {/* ================================================================== */}
        <section id="cara-kerja" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Alur Pembuatan
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Cara Kerja Sederhana 3 Langkah
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Mulai dari memilih gaya hingga membagikan tautan undangan, semuanya selesai dalam hitungan menit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="p-7 rounded-2xl border border-border bg-background/50 space-y-3">
                <span className="font-serif text-3xl font-normal text-primary block">
                  01
                </span>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Pilih Desain
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pilih template master seperti Classic Elegance atau Royal Navy &amp; Gold yang selaras dengan tema pernikahan Anda.
                </p>
              </div>

              <div className="p-7 rounded-2xl border border-border bg-background/50 space-y-3">
                <span className="font-serif text-3xl font-normal text-primary block">
                  02
                </span>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Isi Informasi &amp; Personalisasi
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Lengkapi data mempelai, jadwal akad dan resepsi, peta lokasi Google Maps, kisah cinta, foto pre-wedding, dan musik latar.
                </p>
              </div>

              <div className="p-7 rounded-2xl border border-border bg-background/50 space-y-3">
                <span className="font-serif text-3xl font-normal text-primary block">
                  03
                </span>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Publikasikan &amp; Bagikan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pratinjau hasil akhirnya, terbitkan undangan dengan satu klik, dan bagikan tautan nama tamu khusus via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 7. PREVIEW UNDANGAN                                                */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
              Pratinjau Desain
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
              Pengalaman Responsif di Genggaman Tamu
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
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
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-surface border border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smartphone Frame Simulation */}
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-[40px] border-4 border-text-primary bg-text-primary p-3 shadow-2xl">
              {/* Speaker Notch */}
              <div className="w-24 h-4 bg-text-primary mx-auto rounded-full mb-2 flex items-center justify-center">
                <div className="w-10 h-1.5 bg-text-subtle/40 rounded-full" />
              </div>

              {/* Layar Ponsel */}
              <div className="rounded-[30px] bg-surface text-text-primary overflow-hidden min-h-[500px] flex flex-col justify-between border border-border">
                {activePreviewTab === 'cover' && (
                  <div className="p-6 text-center space-y-6 my-auto animate-fadeIn">
                    <p className="text-[10px] tracking-widest uppercase text-text-subtle font-semibold">
                      Kepada Yth. Tamu Undangan
                    </p>
                    <div className="py-2">
                      <div className="w-14 h-14 mx-auto rounded-full border border-border bg-background flex items-center justify-center font-serif text-lg font-bold text-primary">
                        R &amp; D
                      </div>
                      <h3 className="font-serif text-2xl font-normal text-text-primary mt-3">
                        Rika &amp; Dani
                      </h3>
                      <p className="text-xs text-text-muted mt-1">15 Oktober 2026</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border text-[11px] text-text-muted">
                      Buka Undangan Digital
                    </div>
                  </div>
                )}

                {activePreviewTab === 'couple' && (
                  <div className="p-6 space-y-4 my-auto animate-fadeIn text-center">
                    <p className="text-[10px] tracking-widest uppercase text-text-subtle font-semibold">
                      Pasangan Mempelai
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-serif text-lg font-semibold text-text-primary">
                        Rika Andriana, S.T.
                      </h4>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        Putri tercinta Bapak Herman &amp; Ibu Ratna
                      </p>
                    </div>
                    <DecorativeDivider variant="diamond" className="py-1" />
                    <div className="space-y-2">
                      <h4 className="font-serif text-lg font-semibold text-text-primary">
                        Dani Pratama, M.Sc.
                      </h4>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        Putra tercinta Bapak Surya &amp; Ibu Yuliani
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'event' && (
                  <div className="p-6 space-y-4 my-auto animate-fadeIn">
                    <p className="text-[10px] tracking-widest uppercase text-text-subtle font-semibold text-center">
                      Agenda Pernikahan
                    </p>
                    <div className="p-3.5 rounded-xl border border-border bg-background space-y-1">
                      <p className="text-xs font-semibold text-text-primary">Akad Nikah</p>
                      <p className="text-[11px] text-text-muted">08.00 - 10.00 WIB</p>
                      <p className="text-[10px] text-text-subtle">Masjid Agung Al-Azhar</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border bg-background space-y-1">
                      <p className="text-xs font-semibold text-text-primary">Resepsi Pernikahan</p>
                      <p className="text-[11px] text-text-muted">11.00 - 14.00 WIB</p>
                      <p className="text-[10px] text-text-subtle">Grand Ballroom Jakarta</p>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'gallery' && (
                  <div className="p-6 space-y-4 my-auto animate-fadeIn text-center">
                    <p className="text-[10px] tracking-widest uppercase text-text-subtle font-semibold">
                      Galeri Foto Pre-Wedding
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-24 rounded-lg bg-background border border-border flex items-center justify-center text-xs text-text-subtle font-serif">
                        Foto 1
                      </div>
                      <div className="h-24 rounded-lg bg-background border border-border flex items-center justify-center text-xs text-text-subtle font-serif">
                        Foto 2
                      </div>
                      <div className="h-24 rounded-lg bg-background border border-border flex items-center justify-center text-xs text-text-subtle font-serif">
                        Foto 3
                      </div>
                      <div className="h-24 rounded-lg bg-background border border-border flex items-center justify-center text-xs text-text-subtle font-serif">
                        Foto 4
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'rsvp' && (
                  <div className="p-6 space-y-3 my-auto animate-fadeIn text-center">
                    <p className="text-[10px] tracking-widest uppercase text-text-subtle font-semibold">
                      Konfirmasi Kehadiran &amp; Doa
                    </p>
                    <div className="space-y-2 text-left">
                      <div className="p-2.5 rounded-lg bg-background border border-border text-[11px] text-text-muted">
                        Hadir (2 Orang)
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border border-border text-[11px] text-text-muted">
                        "Semoga menjadi keluarga sakinah mawaddah warahmah!"
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Layar Ponsel */}
                <div className="p-3 bg-surface-elevated border-t border-border text-center">
                  <span className="text-[9px] text-text-subtle uppercase tracking-widest">
                    Aurovia &bull; Undangan Digital
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 8. FITUR INTERAKTIF MENDALAM                                       */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Fitur Lengkap
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Integrasi Komplit dalam Satu Undangan
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Kelola setiap detail interaktif mulai dari konfirmasi kehadiran hingga amplop digital tanpa konfigurasi teknis yang rumit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  RSVP &amp; Rekap Kehadiran
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tamu dapat memilih hadir atau tidak hadir beserta jumlah orang. Anda dapat memantau grafik rekapitulasi jumlah tamu di dashboard secara rapi.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Buku Tamu &amp; Ucapan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tamu dapat menuliskan doa dan harapan baik. Setiap ucapan langsung tampil di seksi buku doa undangan digital Anda.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Amplop Digital &amp; Hadiah
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Sediakan informasi rekening bank atau alamat pengiriman kado fisik dengan tombol salin rekening yang memudahkan tamu.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Galeri Foto Pre-Wedding
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Unggah momen foto terbaik Anda ke storage cloud yang aman, dilengkapi penampil lightbox yang responsif dan jernih.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Musik Latar &amp; Kontrol Audio
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pilih alunan musik romantis yang mengiringi momen pembacaan undangan, lengkap dengan floating audio button yang sopan.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Rangkaian Agenda &amp; Peta
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Mendukung multi-agenda seperti akad, pemberkatan, dan resepsi dengan penunjuk waktu serta navigasi langsung ke Google Maps.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 9. MOBILE-FIRST EXPERIENCE                                         */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
              Kenyamanan Tamu
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal leading-tight">
              Dioptimalkan Khusus untuk Layar Seluler
            </h2>
            <p className="text-sm text-text-muted leading-relaxed font-sans">
              Lebih dari 90% undangan digital diakses melalui smartphone. Aurovia memastikan setiap tombol memiliki area sentuh minimal 44px, teks terbaca jelas, dan tidak ada geseran horizontal yang mengganggu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-4 text-left">
            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
              <p className="text-xs font-semibold text-text-primary">Cepat Diakses</p>
              <p className="text-xs text-text-muted">Aset terkompresi efisien sehingga halaman terbuka instan meski pada koneksi seluler hemat daya.</p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
              <p className="text-xs font-semibold text-text-primary">Ramah Jempol</p>
              <p className="text-xs text-text-muted">Tata letak navigasi bawah dan tombol tindakan diletakkan dalam jangkauan alami satu tangan.</p>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
              <p className="text-xs font-semibold text-text-primary">Tanpa Aplikasi</p>
              <p className="text-xs text-text-muted">Tamu tidak perlu memasang aplikasi tambahan apapun untuk membuka dan mengisi RSVP.</p>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 10. FAQ ACCORDION                                                  */}
        {/* ================================================================== */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-t border-border">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Pertanyaan Umum
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Jawaban faktual mengenai cara kerja dan pembuatan undangan di Aurovia.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'Apa itu Aurovia?',
                  a: 'Aurovia adalah platform pembuat dan pengelola undangan digital pernikahan terstruktur dengan pendekatan tipografi editorial elegan, terintegrasi RSVP, buku tamu, musik latar, serta tautan personal per tamu.',
                },
                {
                  q: 'Apakah saya harus membuat akun?',
                  a: 'Untuk menjelajahi landing page dan melihat informasi fitur, Anda tidak perlu akun. Namun untuk mulai menyusun draf, memilih template, dan menerbitkan undangan, Anda perlu masuk atau mendaftar akun.',
                },
                {
                  q: 'Apakah saya bisa melihat template terlebih dahulu?',
                  a: 'Ya, Anda dapat melihat pratinjau visual template di halaman ini. Untuk mencoba interaksi demo secara penuh, silakan masuk ke akun Anda.',
                },
                {
                  q: 'Apakah undangan bisa dibagikan melalui WhatsApp?',
                  a: 'Tentu. Anda dapat membuat tautan unik untuk masing-masing nama tamu dan membagikannya secara langsung melalui pesan WhatsApp dengan teks pengantar yang rapi.',
                },
                {
                  q: 'Apakah bisa menggunakan foto sendiri?',
                  a: 'Bisa. Anda dapat mengunggah foto pasangan dan galeri foto pre-wedding Anda langsung melalui editor undangan dengan penyimpanan cloud yang aman.',
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
                    className="rounded-xl border border-border bg-background/60 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-serif text-base font-medium text-text-primary hover:bg-background transition-colors min-h-[44px] cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-sm font-sans text-secondary transform transition-transform duration-200">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs text-text-muted leading-relaxed border-t border-border/60 pt-3">
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
        {/* 11. FINAL CTA                                                      */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl sm:text-5xl text-text-primary font-normal leading-tight">
              Siap Membuat Undangan Anda?
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Mulai buat undangan pernikahan digital Anda sekarang dan bagikan momen bahagia bersama keluarga serta sahabat terdekat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98 min-h-[48px]"
            >
              Mulai Buat Undangan
            </Link>

            <Link
              to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-secondary text-primary bg-primary-soft hover:bg-secondary/15 text-sm font-semibold tracking-wide transition-all min-h-[48px]"
            >
              Lihat Template
            </Link>
          </div>
        </section>
      </main>

      {/* ================================================================== */}
      {/* 12. FOOTER                                                         */}
      {/* ================================================================== */}
      <footer className="border-t border-border bg-surface pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Aurovia" className="h-7 sm:h-8 w-auto object-contain" />
            </div>
            <p className="text-xs text-text-muted max-w-sm leading-relaxed">
              Platform undangan digital terstruktur. Dirancang dengan pendekatan tipografi editorial dan keandalan sistem cloud modern.
            </p>
          </div>

          {/* Navigasi Platform */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Navigasi
            </p>
            <ul className="space-y-2 text-xs text-text-muted">
              <li>
                <a href="#hero" className="hover:text-primary transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-primary transition-colors">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#template" className="hover:text-primary transition-colors">
                  Template
                </a>
              </li>
              <li>
                <a href="#cara-kerja" className="hover:text-primary transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Akses Akun */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Akun
            </p>
            <ul className="space-y-2 text-xs text-text-muted">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Masuk
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">
                  Daftar
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-subtle">
          <p>&copy; 2026 Aurovia. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono text-[10px]">AUROVIA &bull; ELEGANT DIGITAL INVITATION PLATFORM</p>
        </div>
      </footer>
    </div>
  );
}
