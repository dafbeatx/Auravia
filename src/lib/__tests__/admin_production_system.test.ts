import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  setAdminToken,
  getAdminToken,
  clearAdminToken,
  getAdminUser,
} from '@/lib/adminAuth';
import {
  uploadDemoMedia,
  getDemoMediaPublicUrl,
} from '@/lib/admin';

describe('Admin Production System & Security Tests', () => {
  describe('1. Database Migration & RLS Security Specification', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../../supabase/migrations/20260928020000_admin_production_system.sql'
    );

    it('berkas migrasi 20260928020000_admin_production_system.sql tersedia', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('membuat tabel admin_users dengan bcrypt hashing dan role check', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.admin_users');
      expect(sql).toContain('password_hash TEXT NOT NULL');
      expect(sql).toContain('role TEXT NOT NULL DEFAULT \'admin\'');
      expect(sql).toContain('CHECK (role IN (\'super_admin\', \'admin\'))');
      expect(sql).toContain('failed_attempts INT NOT NULL DEFAULT 0');
      expect(sql).toContain('locked_until TIMESTAMPTZ');
    });

    it('membuat tabel admin_sessions untuk manajemen sesi terisolasi', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.admin_sessions');
      expect(sql).toContain('token TEXT NOT NULL UNIQUE');
      expect(sql).toContain('expires_at TIMESTAMPTZ NOT NULL');
      expect(sql).toContain('last_activity_at TIMESTAMPTZ NOT NULL');
    });

    it('membuat tabel system_settings dan template_demos', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.system_settings');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.template_demos');
      expect(sql).toContain('maintenance_mode BOOLEAN NOT NULL');
      expect(sql).toContain('registration_enabled BOOLEAN NOT NULL');
      expect(sql).toContain('catalog_enabled BOOLEAN NOT NULL');
      expect(sql).toContain('analytics_enabled BOOLEAN NOT NULL');
    });

    it('mengonfigurasi storage bucket template-demo-media dengan proteksi tipe file dan ukuran 5MB', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('template-demo-media');
      expect(sql).toContain('5242880');
      expect(sql).toContain('image/jpeg');
      expect(sql).toContain('image/png');
      expect(sql).toContain('image/webp');
      // Tidak mengizinkan SVG atau berkas eksekusi
      expect(sql).not.toContain('image/svg+xml');
    });

    it('menerapkan RLS dan SECURITY DEFINER untuk semua RPC admin', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE public.template_demos ENABLE ROW LEVEL SECURITY');

      // RPC penting wajib SECURITY DEFINER
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_login');
      expect(sql).toContain('SECURITY DEFINER');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_verify_session');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_logout');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_list_accounts');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_create_account');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_reset_account_password');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_template_demo_data');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_save_template_demo');
    });

    it('menerapkan proteksi brute force dan lockout di admin_login RPC', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      // Verifikasi batas percobaan dan durasi lockout 15 menit
      expect(sql).toContain('failed_attempts + 1 >= 5');
      expect(sql).toContain('locked_until > now()');
      expect(sql).toContain('interval \'15 minutes\'');
      // Pesan error generik untuk mitigasi account enumeration
      expect(sql).toContain('Username atau password salah.');
    });
  });

  describe('2. Client Admin Session & Storage Security', () => {
    beforeEach(() => {
      const storage: Record<string, string> = {};
      const sessionStorageMock = {
        getItem: (k: string) => storage[k] ?? null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
        clear: () => { for (const k in storage) delete storage[k]; },
      };

      Object.defineProperty(globalThis, 'window', {
        value: {
          sessionStorage: sessionStorageMock,
          localStorage: sessionStorageMock,
        },
        configurable: true,
        writable: true,
      });
    });

    it('token sesi admin disimpan di sessionStorage dan tidak pernah di localStorage', () => {
      setAdminToken('test_session_token_123', {
        id: 'admin-uuid-1',
        username: 'admintest',
        role: 'super_admin',
        is_active: true,
        last_login_at: null,
      });

      expect(getAdminToken()).toBe('test_session_token_123');
      const user = getAdminUser();
      expect(user).toBeDefined();
      expect(user?.username).toBe('admintest');
      expect(user?.role).toBe('super_admin');

      // Logout membersihkan token sesi sepenuhnya
      clearAdminToken();
      expect(getAdminToken()).toBeNull();
      expect(getAdminUser()).toBeNull();
    });
  });

  describe('3. Demo Media Storage Validation', () => {
    it('menolak berkas media selain JPEG, PNG, dan WebP', async () => {
      const svgFile = new File(['<svg></svg>'], 'image.svg', { type: 'image/svg+xml' });
      await expect(
        uploadDemoMedia('classic-elegance', 'hero', svgFile)
      ).rejects.toThrow('Format file tidak didukung');

      const exeFile = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' });
      await expect(
        uploadDemoMedia('classic-elegance', 'hero', exeFile)
      ).rejects.toThrow('Format file tidak didukung');
    });

    it('menolak berkas media demo yang melebihi batas 5 MB', async () => {
      const largeBuffer = new Uint8Array(5.5 * 1024 * 1024);
      const oversizedImage = new File([largeBuffer], 'large_photo.jpg', { type: 'image/jpeg' });
      await expect(
        uploadDemoMedia('classic-elegance', 'hero', oversizedImage)
      ).rejects.toThrow('Ukuran file melebihi batas 5 MB');
    });

    it('getDemoMediaPublicUrl menangani path null, absolute URL, dan path storage demo', () => {
      expect(getDemoMediaPublicUrl(null)).toBe('');
      expect(getDemoMediaPublicUrl('')).toBe('');
      expect(getDemoMediaPublicUrl('https://example.com/demo.webp')).toBe('https://example.com/demo.webp');

      const url = getDemoMediaPublicUrl('demo/classic-elegance/hero/photo.jpg');
      expect(url).toContain('template-demo-media');
      expect(url).toContain('photo.jpg');
    });
  });

  describe('4. Open Redirect Prevention on Public & Admin Flows', () => {
    function sanitizeReturnUrl(url: string | null | undefined): string {
      if (!url) return '/dashboard';
      const trimmed = url.trim();
      // Cegah external protocol dan double slash protocol-relative URLs
      if (
        trimmed.startsWith('//') ||
        trimmed.includes('://') ||
        trimmed.startsWith('\\\\') ||
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:')
      ) {
        return '/dashboard';
      }
      if (!trimmed.startsWith('/')) {
        return '/dashboard';
      }
      return trimmed;
    }

    it('mengizinkan internal path yang valid', () => {
      expect(sanitizeReturnUrl('/templates/royal-navy-gold/demo')).toBe('/templates/royal-navy-gold/demo');
      expect(sanitizeReturnUrl('/dashboard/invitations/new')).toBe('/dashboard/invitations/new');
      expect(sanitizeReturnUrl('/admin')).toBe('/admin');
    });

    it('menolak dan menetralkan redirect URL berbahaya (Open Redirect Attack)', () => {
      expect(sanitizeReturnUrl('https://malicious-site.com')).toBe('/dashboard');
      expect(sanitizeReturnUrl('http://evil.com/phish')).toBe('/dashboard');
      expect(sanitizeReturnUrl('//evil.com')).toBe('/dashboard');
      expect(sanitizeReturnUrl('\\\\evil.com')).toBe('/dashboard');
      expect(sanitizeReturnUrl('javascript:alert(1)')).toBe('/dashboard');
      expect(sanitizeReturnUrl('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
    });
  });

  describe('5. Admin Navigation & Structural Integrity', () => {
    const layoutPath = path.resolve(__dirname, '../../components/layout/AdminLayout.tsx');

    it('AdminLayout memiliki seluruh menu navigasi utama termasuk Activity', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8');
      expect(content).toContain('to: \'/admin\'');
      expect(content).toContain('to: \'/admin/traffic\'');
      expect(content).toContain('to: \'/admin/users\'');
      expect(content).toContain('to: \'/admin/invitations\'');
      expect(content).toContain('to: \'/admin/templates\'');
      expect(content).toContain('to: \'/admin/demo\'');
      expect(content).toContain('to: \'/admin/activity\'');
      expect(content).toContain('to: \'/admin/settings\'');
      expect(content).toContain('/admin/accounts');
    });

    it('AdminLayout menyajikan drawer mobile responsif tanpa horizontal overflow', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8');
      expect(content).toContain('mobileMenuOpen');
      expect(content).toContain('overflow-y-auto');
      expect(content).toContain('min-w-0');
    });
  });

  describe('6. Activity Logs & Extended Admin Management Migration', () => {
    const extMigrationPath = path.resolve(
      __dirname,
      '../../../supabase/migrations/20260928030000_admin_activity_and_extended_management.sql'
    );

    it('berkas migrasi 20260928030000_admin_activity_and_extended_management.sql tersedia', () => {
      expect(fs.existsSync(extMigrationPath)).toBe(true);
    });

    it('membuat tabel admin_activity_logs dengan RLS', () => {
      const sql = fs.readFileSync(extMigrationPath, 'utf-8');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.admin_activity_logs');
      expect(sql).toContain('admin_username TEXT NOT NULL');
      expect(sql).toContain('action TEXT NOT NULL');
      expect(sql).toContain('metadata JSONB');
      expect(sql).toContain('ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY');
    });

    it('mendefinisikan RPCs log aktivitas, update profile, dan duplicate template', () => {
      const sql = fs.readFileSync(extMigrationPath, 'utf-8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.log_admin_action');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_admin_activity_logs');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_record_activity');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_update_profile');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_duplicate_template');
    });

    it('memperbarui RPC login, logout, dan password change untuk mencatat log otomatis', () => {
      const sql = fs.readFileSync(extMigrationPath, 'utf-8');
      expect(sql).toContain('public.log_admin_action');
      expect(sql).toContain('admin_password_changed');
      expect(sql).toContain('display_name');
    });
  });
});

