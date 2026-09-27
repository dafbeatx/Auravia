import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MonogramFrame } from '@/components/template/ornaments';
import { TemplateCarousel } from '@/components/landing/TemplateCarousel';
import { trackEvent } from '@/lib/analytics';

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

  // Catat event kunjungan halaman landing page publik
  useEffect(() => {
    trackEvent({ event_name: 'landing_view', path: '/', user_id: user?.id });
  }, [user?.id]);

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
    { label: 'Bantuan', href: '#faq' },
  ];

  // URL aman untuk aksi yang membutuhkan autentikasi
  const createInvitationUrl = user
    ? '/dashboard/invitations/new'
    : '/login?redirect=%2Fdashboard%2Finvitations%2Fnew';

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-accent-light/40 antialiased font-sans flex flex-col">
      {/* ================================================================== */}
      {/* NAVBAR STICKY                                                      */}
      {/* ================================================================== */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-xs border-b border-border'
            : 'bg-background border-b border-border/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo Brand */}
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
                className="text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
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
                  to={createInvitationUrl}
                  className="text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-full transition-all min-h-[44px] flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                >
                  Buat Undangan
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Tutup navigasi seluler' : 'Buka navigasi seluler'}
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
          <div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-6 space-y-4 animate-fadeIn">
            <nav className="flex flex-col space-y-1" aria-label="Menu Seluler">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-sm font-semibold text-text-primary hover:bg-surface transition-colors min-h-[44px] flex items-center"
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
                    to={createInvitationUrl}
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

      <main className="flex-1">
        {/* ================================================================== */}
        {/* SECTION 1: HERO                                                    */}
        {/* ================================================================== */}
        <section id="hero" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Kolom Teks Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-primary text-xs font-semibold tracking-wide">
                <span>Platform Undangan Digital Terstruktur</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-text-primary font-normal leading-tight tracking-tight">
                Undangan Digital yang Dibuat untuk Cerita yang Berarti.
              </h1>

              <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Bagikan momen pernikahan Anda melalui undangan digital yang elegan, personal, dan mudah dibagikan.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <a
                  href="#template"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-border bg-surface hover:bg-surface-elevated text-text-primary text-sm font-semibold tracking-wide transition-all min-h-[48px] cursor-pointer"
                >
                  Lihat Template
                </a>

                <Link
                  to={createInvitationUrl}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98 min-h-[48px] cursor-pointer"
                >
                  Buat Undangan
                </Link>
              </div>

              <p className="text-xs text-text-subtle pt-1">
                Gratis untuk mulai membuat undangan pertama Anda
              </p>

              {/* Trust Signal Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {[
                  { label: 'Tanpa instalasi', icon: '✦' },
                  { label: 'Responsif di ponsel', icon: '✦' },
                  { label: 'Mudah dibagikan', icon: '✦' },
                  { label: 'Dapat disesuaikan', icon: '✦' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-surface/70 border border-border/80 text-[11px] text-text-muted font-medium">
                    <span className="text-primary text-xs">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Visual Mockup Hero */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[360px] sm:max-w-[400px]">
                {/* Kartu 1: Royal Navy & Gold Inset Preview */}
                <div className="rounded-3xl border border-[#D4AF37]/40 bg-[#0B132B] text-[#FAF9F6] p-6 shadow-xl space-y-4 transform transition-transform hover:scale-[1.01]">
                  <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37]">
                      Royal Navy &amp; Gold
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                      Master Design
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
                <div className="mt-4 p-5 rounded-2xl border border-border bg-surface text-text-primary shadow-md flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-secondary/40 bg-secondary/10 flex items-center justify-center font-serif text-sm font-semibold text-primary">
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
                  <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10">
                    Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 2: TRUST / VALUE STRIP                                     */}
        {/* ================================================================== */}
        <section className="border-y border-border bg-surface py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">
                Nilai &amp; Manfaat Nyata
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary">
                Segala yang Dibutuhkan untuk Momen Berharga Anda
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Dirancang untuk membuat proses undangan terasa lebih sederhana
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center pb-8 border-b border-border/60">
              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-primary">✦</span>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Desain Elegan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tipografi berkelas dan harmoni warna yang disusun oleh desainer.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-primary">✦</span>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Mudah Dipersonalisasi
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Sesuaikan kisah, foto, agenda acara, dan musik latar Anda.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-primary">✦</span>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Dibagikan Secara Digital
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tautan unik per tamu yang siap dikirim lewat pesan instan.
                </p>
              </div>

              <div className="space-y-1.5 p-2">
                <span className="text-xl sm:text-2xl text-primary">✦</span>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                  Terintegrasi RSVP
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Konfirmasi kehadiran dan ucapan doa tercatat rapi di dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  title: 'Template Responsif',
                  desc: 'Tampilan tetap presisi dan proporsional di layar ponsel, tablet, maupun desktop.',
                },
                {
                  title: 'Bisa Dikustomisasi',
                  desc: 'Ubah teks, urutan seksi, foto, hingga palet aksen sesuai kepribadian perayaan Anda.',
                },
                {
                  title: 'RSVP Digital',
                  desc: 'Konfirmasi kehadiran dan jumlah tamu tercatat instan di dashboard tanpa tercecer.',
                },
                {
                  title: 'Galeri Foto',
                  desc: 'Tampilkan dokumentasi prewedding dalam susunan grid visual yang ringan diakses.',
                },
                {
                  title: 'Kisah Pasangan',
                  desc: 'Bagikan narasi perjalanan cinta dan tanggal penting menuju ikatan pernikahan.',
                },
                {
                  title: 'Informasi Acara',
                  desc: 'Rincian waktu, lokasi, dan integrasi penunjuk arah peta Google Maps yang akurat.',
                },
                {
                  title: 'Amplop Digital',
                  desc: 'Tanda kasih virtual via nomor rekening atau dompet digital yang praktis dan aman.',
                },
                {
                  title: 'Musik Latar',
                  desc: 'Iringan nada romantis yang dapat diputar secara santun dengan kendali volume tamu.',
                },
                {
                  title: 'Tautan Undangan Personal',
                  desc: 'Satu tautan khusus dengan nama penerima tertera langsung pada sampul pembuka.',
                },
              ].map((val, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl border border-border bg-background/60 hover:bg-surface hover:border-secondary/40 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h4 className="font-serif text-base sm:text-lg font-semibold text-text-primary">
                      {val.title}
                    </h4>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 3: KENAPA AUROVIA                                          */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Kualitas Terstruktur
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
              Kenapa Memilih Aurovia
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Bukan sekadar formulir digital, Aurovia dirancang sebagai perayaan visual momen bahagia Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-border bg-surface space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-primary font-serif text-xl font-bold">
                01
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Tipografi Editorial Terkurasi
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Setiap font serif dan sans-serif dipilih secara presisi untuk menghadirkan nuansa undangan fisik yang mewah dan mudah dibaca di layar mana pun.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-surface space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-primary font-serif text-xl font-bold">
                02
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Arsitektur Modular &amp; Ringan
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Tanpa bloatware atau script pelacak yang berat. Undangan dapat dibuka seketika oleh tamu meski berada dalam jaringan seluler terbatas.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-surface space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-primary font-serif text-xl font-bold">
                03
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Isolasi Data Aman &amp; Privat
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Setiap draf undangan dan data tamu tersimpan aman dengan Row Level Security di database PostgreSQL terisolasi.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 4: FITUR UTAMA                                             */}
        {/* ================================================================== */}
        <section id="fitur" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Fitur Lengkap
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Semua yang Dibutuhkan untuk Satu Undangan
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Fitur terintegrasi yang memudahkan calon mempelai mengelola informasi dan memudahkan tamu merespons.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  no: '01',
                  title: 'Hero & Cover',
                  desc: 'Halaman sampul beranimasi halus dengan nama tamu khusus untuk sentuhan personal pembuka.',
                },
                {
                  no: '02',
                  title: 'Profil Mempelai',
                  desc: 'Foto, nama lengkap, silsilah keluarga, serta tautan akun media sosial pasangan pengantin.',
                },
                {
                  no: '03',
                  title: 'Kisah Kami',
                  desc: 'Timeline kisah cinta dan kenangan berharga perjalanan pasangan menuju jenjang pernikahan.',
                },
                {
                  no: '04',
                  title: 'Agenda Acara',
                  desc: 'Mendukung beberapa agenda (Akad, Pemberkatan, Resepsi) lengkap dengan navigasi Google Maps.',
                },
                {
                  no: '05',
                  title: 'Galeri Foto',
                  desc: 'Koleksi foto prewedding yang diunggah dan disimpan pada cloud storage dengan kompresi optimal.',
                },
                {
                  no: '06',
                  title: 'RSVP Digital',
                  desc: 'Konfirmasi kehadiran tamu beserta jumlah pendamping untuk estimasi akurat kapasitas tempat.',
                },
                {
                  no: '07',
                  title: 'Doa & Ucapan',
                  desc: 'Buku tamu digital interaktif tempat keluarga dan sahabat meninggalkan untaian doa restu.',
                },
                {
                  no: '08',
                  title: 'Amplop Digital',
                  desc: 'Kemudahan bagi tamu yang ingin menyampaikan tanda kasih melalui nomor rekening bank atau e-wallet resmi.',
                },
                {
                  no: '09',
                  title: 'Musik Latar',
                  desc: 'Pemutar audio latar melodi romantis dengan tombol jeda yang ramah privasi pengunjung.',
                },
              ].map((feature) => (
                <div
                  key={feature.no}
                  className="p-6 sm:p-7 rounded-2xl border border-border bg-background/50 hover:bg-surface hover:border-secondary/50 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-secondary">
                      {feature.no}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 5: TEMPLATE SHOWCASE ("PILIHAN TEMA UNDANGAN")             */}
        {/* ================================================================== */}
        <section id="template" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-text-primary font-normal leading-tight">
              Pilihan Tema Undangan yang Siap Dipakai
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Banyak pilihan tema premium dan langsung bisa digunakan tanpa ribet.
            </p>
          </div>

          <TemplateCarousel />
        </section>

        {/* ================================================================== */}
        {/* SECTION 6: CARA KERJA 3 LANGKAH                                   */}
        {/* ================================================================== */}
        <section id="cara-kerja" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-14">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Alur Praktis
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Cara Kerja Aurovia
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Tiga tahapan sederhana merancang dan menyebarkan undangan digital Anda tanpa kebingungan teknis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Pilih Template',
                  desc: 'Pilih salah satu template kurasi desainer kami yang selaras dengan tema hari bahagia Anda.',
                },
                {
                  step: '02',
                  title: 'Isi Informasi Undangan',
                  desc: 'Lengkapi identitas pasangan, waktu, lokasi, kisah cinta, foto galeri, hingga musik latar pilihan.',
                },
                {
                  step: '03',
                  title: 'Bagikan Undangan',
                  desc: 'Pratinjau hasil undangan Anda, publikasikan dengan satu klik, dan bagikan tautan khusus per tamu.',
                },
              ].map((s) => (
                <div key={s.step} className="p-8 rounded-2xl border border-border bg-background/50 space-y-4 relative">
                  <span className="font-serif text-3xl sm:text-4xl font-normal text-secondary block">
                    {s.step}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-text-primary">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 7: PREVIEW UNDANGAN DI SMARTPHONE                          */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Tampilan Layar Ponsel
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
                      : 'bg-surface border border-border text-text-muted hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Frame Mockup Container */}
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-[40px] border-4 border-text-primary bg-text-primary p-3 shadow-2xl">
              <div className="rounded-[32px] overflow-hidden bg-background text-text-primary border border-border min-h-[520px] flex flex-col justify-between">
                {/* Status Bar Simulasi */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[10px] font-mono text-text-subtle border-b border-border/50">
                  <span>AUROVIA PREVIEW</span>
                  <span>9:41</span>
                </div>

                {/* Konten Tab Pratinjau */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  {activePreviewTab === 'cover' && (
                    <div className="space-y-4 animate-fadeIn">
                      <span className="text-[10px] uppercase tracking-widest text-text-subtle font-mono">
                        Undangan Pernikahan
                      </span>
                      <MonogramFrame initials="S & D" variant="classic-ring" />
                      <h3 className="font-serif text-3xl text-text-primary font-normal">
                        Sarah &amp; Dimas
                      </h3>
                      <p className="text-xs text-text-muted">
                        Kepada Yth. Bapak/Ibu/Saudara/i
                      </p>
                      <div className="px-4 py-2 rounded-full bg-secondary/15 text-primary text-xs font-semibold">
                        Buka Undangan
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'couple' && (
                    <div className="space-y-4 animate-fadeIn">
                      <span className="text-[10px] uppercase tracking-widest text-text-subtle font-mono">
                        Pasangan Mempelai
                      </span>
                      <div className="space-y-3">
                        <div className="p-3 rounded-2xl bg-surface border border-border">
                          <p className="font-serif text-lg font-semibold text-text-primary">
                            Sarah Amanda, S.Kom
                          </p>
                          <p className="text-[11px] text-text-muted">
                            Putri dari Bpk. Hendra &amp; Ibu Ratna
                          </p>
                        </div>
                        <span className="text-primary text-sm font-serif">&amp;</span>
                        <div className="p-3 rounded-2xl bg-surface border border-border">
                          <p className="font-serif text-lg font-semibold text-text-primary">
                            Dimas Pratama, M.Eng
                          </p>
                          <p className="text-[11px] text-text-muted">
                            Putra dari Bpk. Bambang &amp; Ibu Sri
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'event' && (
                    <div className="space-y-4 animate-fadeIn w-full">
                      <span className="text-[10px] uppercase tracking-widest text-text-subtle font-mono">
                        Agenda Acara
                      </span>
                      <div className="p-4 rounded-2xl bg-surface border border-border text-left space-y-2">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                          Akad Nikah
                        </span>
                        <p className="text-xs font-semibold text-text-primary">
                          08:00 - 10:00 WIB
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Masjid Agung Al-Barkah, Jakarta Selatan
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface border border-border text-left space-y-2">
                        <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                          Resepsi
                        </span>
                        <p className="text-xs font-semibold text-text-primary">
                          11:30 - 14:00 WIB
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Grand Ballroom Hotel Indonesia Kempinski
                        </p>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'gallery' && (
                    <div className="space-y-3 animate-fadeIn w-full">
                      <span className="text-[10px] uppercase tracking-widest text-text-subtle font-mono">
                        Galeri Cerita
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-24 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-[10px] text-text-muted">
                          Foto 01
                        </div>
                        <div className="h-24 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-[10px] text-text-muted">
                          Foto 02
                        </div>
                        <div className="h-24 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-[10px] text-text-muted">
                          Foto 03
                        </div>
                        <div className="h-24 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-[10px] text-text-muted">
                          Foto 04
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'rsvp' && (
                    <div className="space-y-3 animate-fadeIn w-full">
                      <span className="text-[10px] uppercase tracking-widest text-text-subtle font-mono">
                        Konfirmasi Kehadiran
                      </span>
                      <div className="p-4 rounded-2xl bg-surface border border-border text-left space-y-2.5">
                        <div className="text-[11px] font-semibold text-text-primary">
                          Apakah Anda berkenan hadir?
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                            Hadir
                          </span>
                          <span className="px-3 py-1 rounded-full bg-background border border-border text-text-muted text-[10px]">
                            Maaf, Berhalangan
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Frame Mockup */}
                <div className="p-4 border-t border-border bg-surface-elevated text-center">
                  <Link
                    to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Lihat Semua Template &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 8: INTERAKTIVITAS TAMU                                     */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Interaksi Tanpa Hambatan
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Memberi Kemudahan Nyata bagi Tamu
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Tamu undangan dapat merespons kehadiran, menuliskan doa restu, hingga mengirimkan tanda kasih dengan mudah langsung dari peramban ponsel mereka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border border-border bg-background/50 space-y-3">
                <div className="text-2xl text-primary">💌</div>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Buku Tamu &amp; Doa Digital
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Semua ucapan tulus dari sahabat dan sanak famili tersimpan secara permanen dan dapat Anda baca kembali kapan saja.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-border bg-background/50 space-y-3">
                <div className="text-2xl text-secondary">🎁</div>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Tanda Kasih &amp; Amplop Digital
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Tersedia tombol salin nomor rekening bank maupun scan QRIS tanpa potongan pihak ketiga untuk tamu yang berhalangan hadir.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-border bg-background/50 space-y-3">
                <div className="text-2xl text-primary">📍</div>
                <h3 className="font-serif text-xl font-semibold text-text-primary">
                  Penunjuk Arah Google Maps
                </h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Tamu langsung diarahkan ke aplikasi navigasi resmi hanya dengan satu sentuhan tanpa perlu mengetik ulang alamat lokasi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 9: MOBILE-FIRST EXPERIENCE                                */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Sentuhan Ramah Jari
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal leading-snug">
                Didesain Spesifik untuk Pengalaman Ponsel
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Kami memastikan setiap tombol memiliki target sentuh minimal 44px, tipografi proporsional tanpa zoom paksa, dan tata letak vertikal yang mengalir alami tanpa scroll horizontal yang mengganggu.
              </p>
              <div className="space-y-3">
                {[
                  'Bebas horizontal scroll di seluruh ukuran layar smartphone',
                  'Kompresi gambar cerdas untuk pemuatan kilat pada jaringan seluler',
                  'Tombol tindakan utama selalu dalam jangkauan jempol',
                ].map((point, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-text-primary font-medium">
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-primary flex items-center justify-center text-xs">
                      ✓
                    </span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-border bg-surface shadow-xs space-y-4">
              <h3 className="font-serif text-2xl text-text-primary font-semibold">
                Template adalah awal. Cerita Anda yang membuatnya berbeda.
              </h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Anda memiliki kendali penuh untuk menyusun nama panggilan, urutan seksi, memilih lagu latar pengiring, hingga mengaktifkan atau menonaktifkan fitur seperti amplop digital dan RSVP sesuai kenyamanan keluarga Anda.
              </p>
              <div className="pt-2">
                <Link
                  to={createInvitationUrl}
                  className="inline-flex items-center px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold tracking-wide transition-colors min-h-[44px]"
                >
                  Mulai Kustomisasi
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 10: TRUST & KEAMANAN DATA                                  */}
        {/* ================================================================== */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Integritas Sistem
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
                Data Undangan Anda Tetap Terjaga
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Kami memegang prinsip keamanan multi-tenant yang ketat agar privasi momen sakral Anda terlindungi secara menyeluruh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Autentikasi Akun
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Akses editor hanya dapat dibuka oleh pemilik akun yang sah melalui sesi terverifikasi.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Isolasi Data RLS
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tiap baris data undangan dilindungi oleh PostgreSQL Row-Level Security di level database.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Penyimpanan Aman
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Berkas foto galeri dan pasangan disimpan pada direktori cloud terisolasi per pemilik akun.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-background/50 space-y-2.5">
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Draft Bersifat Privat
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Undangan tidak akan dapat diakses oleh publik sebelum Anda sendiri yang mempublikasikannya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 11: FAQ ACCORDION                                          */}
        {/* ================================================================== */}
        <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Pertanyaan Umum
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-text-primary font-normal">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Jawaban faktual seputar penggunaan platform undangan digital Aurovia.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Apa itu Aurovia?',
                a: 'Aurovia adalah platform pembuat dan pengelola undangan pernikahan digital yang mengedepankan estetika tipografi editorial dan keandalan sistem cloud modern.',
              },
              {
                q: 'Apakah saya harus membuat akun?',
                a: 'Ya, Anda membutuhkan akun Aurovia untuk menyimpan draft, mengunggah foto, dan memantau rekapan konfirmasi RSVP tamu undangan secara aman.',
              },
              {
                q: 'Apakah saya bisa melihat template terlebih dahulu?',
                a: 'Bisa. Anda dapat melihat pratinjau desain di landing page ini, dan setelah masuk ke akun Aurovia, Anda dapat mengeksplorasi seluruh katalog dan demo template secara interaktif.',
              },
              {
                q: 'Apakah undangan bisa dibagikan melalui WhatsApp?',
                a: 'Bisa. Setiap undangan memiliki tautan unik yang dapat langsung Anda salin dan kirimkan kepada daftar tamu melalui WhatsApp maupun pesan teks lainnya.',
              },
              {
                q: 'Apakah bisa menggunakan foto sendiri?',
                a: 'Tentu. Anda dapat mengunggah foto profil mempelai dan foto-foto kenangan di galeri secara langsung melalui editor undangan Aurovia.',
              },
              {
                q: 'Apakah bisa memiliki beberapa agenda acara?',
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
                  className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-serif text-base font-medium text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] cursor-pointer"
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
        </section>

        {/* ================================================================== */}
        {/* SECTION 12: FINAL CTA                                              */}
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
              to={createInvitationUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-98 min-h-[48px]"
            >
              Mulai Buat Undangan
            </Link>

            <Link
              to="/login?redirect=%2Fdashboard%2Finvitations%2Fnew"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-border bg-surface hover:bg-surface-elevated text-text-primary text-sm font-semibold tracking-wide transition-all min-h-[48px]"
            >
              Lihat Template
            </Link>
          </div>
        </section>
      </main>

      {/* ================================================================== */}
      {/* FOOTER                                                             */}
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
