import { describe, it, expect } from 'vitest';
import { getSafeRedirectUrl } from '@/lib/urls';
import * as fs from 'fs';
import * as path from 'path';

describe('Aurovia Landing Page & Authenticated Entry Flow', () => {
  describe('Safe Redirect URL Validation (getSafeRedirectUrl)', () => {
    it('mengizinkan path internal yang valid', () => {
      expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/dashboard/invitations/new')).toBe('/dashboard/invitations/new');
      expect(getSafeRedirectUrl('/dashboard/invitations/inv-123')).toBe('/dashboard/invitations/inv-123');
      expect(getSafeRedirectUrl('/login')).toBe('/login');
    });

    it('menolak URL eksternal dengan protokol dan mengembalikan fallback', () => {
      expect(getSafeRedirectUrl('https://malicious.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('http://malicious.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('//malicious.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/dashboard');
      expect(getSafeRedirectUrl('data:text/html,bad')).toBe('/dashboard');
    });

    it('menolak manipulasi backslash dan skema berbahaya', () => {
      expect(getSafeRedirectUrl('/\\malicious.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('\\malicious.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl('/login:bad')).toBe('/dashboard');
    });

    it('menggunakan custom fallback jika path tidak valid atau null', () => {
      expect(getSafeRedirectUrl(null, '/login')).toBe('/login');
      expect(getSafeRedirectUrl('', '/custom-fallback')).toBe('/custom-fallback');
      expect(getSafeRedirectUrl('invalid-path', '/custom-fallback')).toBe('/custom-fallback');
    });
  });
  describe('Verifikasi Integritas Source Code Landing Page', () => {
    const landingPath = path.resolve(__dirname, '../../app/routes/LandingPage.tsx');
    const landingSource = fs.readFileSync(landingPath, 'utf-8');
    const carouselPath = path.resolve(__dirname, '../../components/landing/TemplateCarousel.tsx');
    const carouselSource = fs.readFileSync(carouselPath, 'utf-8');

    it('LandingPage.tsx memiliki seluruh section yang diwajibkan', () => {
      // Section 1: Navbar
      expect(landingSource).toContain('AUROVIA');
      expect(landingSource).toContain('Buat Undangan');
      expect(landingSource).toContain('Masuk');

      // Section 2: Hero
      expect(landingSource).toContain('Undangan Digital yang Dibuat untuk Momen yang Berarti');
      expect(landingSource).toContain('Gratis untuk mulai membuat');

      // Section 3: Value Strip
      expect(landingSource).toContain('Dirancang untuk membuat proses undangan terasa lebih sederhana');
      expect(landingSource).toContain('Desain Elegan');
      expect(landingSource).toContain('Mudah Dipersonalisasi');
      expect(landingSource).toContain('Dibagikan Secara Digital');
      expect(landingSource).toContain('Terintegrasi RSVP');

      // Section 4: Template Showcase & Carousel
      expect(landingSource).toContain('Pilihan Tema Undangan yang Siap Dipakai');
      expect(landingSource).toContain('TemplateCarousel');
      expect(landingSource).toContain('Classic Elegance');
      expect(landingSource).toContain('Royal Navy & Gold');
      expect(carouselSource).toContain('classic-elegance');
      expect(carouselSource).toContain('royal-navy-gold');
      expect(carouselSource).toContain('botanical-garden');
      expect(carouselSource).toContain('modern-minimal');
      expect(carouselSource).toContain('Lihat Demo');

      // Section 5: Fitur Utama
      expect(landingSource).toContain('Semua yang Dibutuhkan untuk Satu Undangan');
      expect(landingSource).toContain('Hero & Cover');
      expect(landingSource).toContain('Profil Mempelai');
      expect(landingSource).toContain('Kisah Kami');
      expect(landingSource).toContain('Agenda Acara');
      expect(landingSource).toContain('Galeri Foto');
      expect(landingSource).toContain('RSVP Digital');
      expect(landingSource).toContain('Doa & Ucapan');
      expect(landingSource).toContain('Amplop Digital');
      expect(landingSource).toContain('Musik Latar');

      // Section 6: Preview Smartphone
      expect(landingSource).toContain('Pengalaman Responsif di Genggaman Tamu');
      expect(landingSource).toContain('Lihat Semua Template');

      // Section 7: Cara Kerja
      expect(landingSource).toContain('01');
      expect(landingSource).toContain('Pilih Desain');
      expect(landingSource).toContain('02');
      expect(landingSource).toContain('Personalisasi Konten');
      expect(landingSource).toContain('03');
      expect(landingSource).toContain('Terbitkan & Bagikan');

      // Section 8: Personalisasi
      expect(landingSource).toContain('Template adalah awal. Cerita Anda yang membuatnya berbeda.');

      // Section 9: Trust & Security
      expect(landingSource).toContain('Data Undangan Anda Tetap Terjaga');
      expect(landingSource).toContain('Autentikasi Akun');
      expect(landingSource).toContain('Isolasi Data RLS');
      expect(landingSource).toContain('Penyimpanan Aman');
      expect(landingSource).toContain('Draft Bersifat Privat');

      // Section 10: FAQ
      expect(landingSource).toContain('Pertanyaan yang Sering Diajukan');
      expect(landingSource).toContain('Apa itu Aurovia?');
      expect(landingSource).toContain('Apakah saya harus membuat akun?');

      // Section 11: Final CTA
      expect(landingSource).toContain('Siap Membuat Undangan Anda?');

      // Section 12: Footer
      expect(landingSource).toContain('Platform undangan digital terstruktur.');
      expect(landingSource).toContain('2026 Aurovia');
    });

    it('CTA template mengarahkan anonymous ke /login dengan parameter redirect aman', () => {
      // Tidak boleh ada link langsung ke editor invitation dari landing page publik untuk anonymous
      expect(landingSource).toContain('/login?redirect=%2Fdashboard%2Finvitations%2Fnew');
    });

    it('tidak menggunakan data statistik atau testimonial palsu', () => {
      expect(landingSource).not.toContain('10.000+');
      expect(landingSource).not.toContain('jutaan orang');
      expect(landingSource).not.toContain('Testimoni');
      expect(landingSource).not.toMatch(/bintang 5|rating palsu/i);
    });

    it('tidak menggunakan karakter em dash', () => {
      expect(landingSource).not.toContain('\u2014');
    });

    it('tidak menduplikasi teks nama brand di samping logo.svg', () => {
      expect(landingSource).not.toMatch(/<img[^>]+logo\.svg[^>]*>\s*<span[^>]*>AUROVIA<\/span>/i);
    });
  });

  describe('Verifikasi Global Design Tokens Palette (#006A71, #48A6A7, #9ACBD0, #F2EFE7)', () => {
    const tokensPath = path.resolve(__dirname, '../../styles/tokens.css');
    const tokensSource = fs.readFileSync(tokensPath, 'utf-8');

    it('tokens.css memiliki nilai palet terpusat yang diwajibkan', () => {
      expect(tokensSource).toContain('--color-primary: #006A71');
      expect(tokensSource).toContain('--color-secondary: #48A6A7');
      expect(tokensSource).toContain('--color-accent-light: #9ACBD0');
      expect(tokensSource).toContain('--color-background: #F2EFE7');
      expect(tokensSource).toContain('--color-surface');
      expect(tokensSource).toContain('--color-border');
      expect(tokensSource).toContain('--color-text');
      expect(tokensSource).toContain('--color-focus');
    });
  });

  describe('Verifikasi Login & Register Sesuai Pedoman', () => {
    const loginPath = path.resolve(__dirname, '../../app/routes/Login.tsx');
    const registerPath = path.resolve(__dirname, '../../app/routes/Register.tsx');
    const loginSource = fs.readFileSync(loginPath, 'utf-8');
    const registerSource = fs.readFileSync(registerPath, 'utf-8');

    it('Login mematuhi aturan visual dan fungsional', () => {
      expect(loginSource).toContain('Masuk ke Aurovia');
      expect(loginSource).toContain('login-email');
      expect(loginSource).toContain('login-password');
      expect(loginSource).toContain('Lupa password?');
      expect(loginSource).toContain('Masuk dengan kode akses');
      expect(loginSource).toContain('Masuk dengan Google');
      expect(loginSource).toContain('Buat Akun Baru');
      expect(loginSource).toContain('getSafeRedirectUrl');

      // TIDAK ADA Apple login
      expect(loginSource).not.toContain('Apple');
      expect(loginSource).not.toContain('apple');

      // Tidak ada em dash
      expect(loginSource).not.toContain('\u2014');

      // Tidak ada duplikasi teks AUROVIA di samping logo.svg
      expect(loginSource).not.toMatch(/<img[^>]+logo\.svg[^>]*>\s*<span[^>]*>AUROVIA<\/span>/i);
    });

    it('Register konsisten dengan Login dan tidak memiliki Apple login', () => {
      expect(registerSource).toContain('Buat Undangan Anda');
      expect(registerSource).toContain('Daftar');
      expect(registerSource).toContain('Daftar dengan Google');
      expect(registerSource).toContain('Sudah punya akun?');
      expect(registerSource).toContain('getSafeRedirectUrl');

      // TIDAK ADA Apple login
      expect(registerSource).not.toContain('Apple');
      expect(registerSource).not.toContain('apple');

      // Tidak ada em dash
      expect(registerSource).not.toContain('\u2014');

      // Tidak ada duplikasi teks AUROVIA di samping logo.svg
      expect(registerSource).not.toMatch(/<img[^>]+logo\.svg[^>]*>\s*<span[^>]*>AUROVIA<\/span>/i);
    });
  });

  describe('Verifikasi Routing & Security', () => {
    const routerPath = path.resolve(__dirname, '../../app/router.tsx');
    const routerSource = fs.readFileSync(routerPath, 'utf-8');

    it('rute index / mengarah ke LandingPage dan bukan FoundationStatus', () => {
      expect(routerSource).toContain('LandingPage');
      expect(routerSource).not.toContain('FoundationStatus');
    });

    it('dashboard, editor, dan demo template berada di bawah ProtectedRoute', () => {
      expect(routerSource).toContain('ProtectedRoute');
      expect(routerSource).toContain('templates/:slug/demo');
      expect(routerSource).toContain('TemplateDemo');
      expect(routerSource).toContain('dashboard/invitations/new');
      expect(routerSource).toContain('dashboard/invitations/:id');
    });
  });
});
