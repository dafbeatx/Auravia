import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getOrCreateSessionId,
  detectDeviceType,
  detectBrowser,
  trackEvent,
} from '@/lib/analytics';
import {
  uploadTemplatePreviewImage,
  getTemplateAssetPublicUrl,
} from '@/lib/admin';

describe('Admin, Template Management & Analytics System', () => {
  describe('1. Analytics Engine & Session Management', () => {
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
          innerWidth: 1200,
          location: { pathname: '/admin' },
        },
        configurable: true,
        writable: true,
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
        configurable: true,
        writable: true,
      });
    });

    it('membuat anonymous session ID yang unik dan menyimpannya di sessionStorage', () => {
      const sid1 = getOrCreateSessionId();
      expect(sid1).toBeDefined();
      expect(typeof sid1).toBe('string');
      expect(sid1.length).toBeGreaterThan(5);

      // Panggilan kedua harus menghasilkan session ID yang sama persis
      const sid2 = getOrCreateSessionId();
      expect(sid2).toBe(sid1);
    });

    it('mendeteksi device type dan browser secara aman', () => {
      const device = detectDeviceType();
      expect(['desktop', 'tablet', 'mobile', 'unknown']).toContain(device);

      const browser = detectBrowser();
      expect(typeof browser).toBe('string');
      expect(browser.length).toBeGreaterThan(0);
    });

    it('trackEvent berjalan secara asinkron tanpa melempar exception ke antarmuka pengguna', async () => {
      await expect(
        trackEvent({
          event_name: 'test_event',
          path: '/test',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('2. Upload & Preview Asset Validation', () => {
    it('menolak format berkas selain JPEG, PNG, dan WebP', async () => {
      const fakeSvgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
      await expect(
        uploadTemplatePreviewImage('tmpl-123', 'mobile', fakeSvgFile)
      ).rejects.toThrow('Format file tidak didukung');

      const fakePdfFile = new File(['pdf-data'], 'doc.pdf', { type: 'application/pdf' });
      await expect(
        uploadTemplatePreviewImage('tmpl-123', 'mobile', fakePdfFile)
      ).rejects.toThrow('Format file tidak didukung');
    });

    it('menolak berkas yang melebihi batas ukuran 5 MB', async () => {
      // Buat berkas tiruan sebesar 5.5 MB
      const bigBuffer = new Uint8Array(6 * 1024 * 1024);
      const oversizedFile = new File([bigBuffer], 'heavy.jpg', { type: 'image/jpeg' });

      await expect(
        uploadTemplatePreviewImage('tmpl-123', 'mobile', oversizedFile)
      ).rejects.toThrow('Ukuran file melebihi batas 5 MB');
    });

    it('getTemplateAssetPublicUrl menangani path null, absolute URL, dan relative path', () => {
      expect(getTemplateAssetPublicUrl(null)).toBe('');
      expect(getTemplateAssetPublicUrl('')).toBe('');
      expect(getTemplateAssetPublicUrl('https://example.com/photo.jpg')).toBe(
        'https://example.com/photo.jpg'
      );
      expect(getTemplateAssetPublicUrl('/templates/royal/thumbnail.webp')).toBe(
        '/templates/royal/thumbnail.webp'
      );

      const storageUrl = getTemplateAssetPublicUrl('templates/123/preview/mobile.webp');
      expect(storageUrl).toContain('template-assets');
      expect(storageUrl).toContain('mobile.webp');
    });
  });

  describe('3. Guard Keamanan & Kepatuhan Aturan Project', () => {
    const srcDir = path.resolve(__dirname, '../../');

    function checkFilesForPattern(
      dir: string,
      forbiddenPattern: RegExp | string,
      description: string,
      excludeDirs: string[] = ['__tests__', 'node_modules', '.git']
    ) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            checkFilesForPattern(fullPath, forbiddenPattern, description, excludeDirs);
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.ts') ||
            entry.name.endsWith('.tsx') ||
            entry.name.endsWith('.js') ||
            entry.name.endsWith('.jsx'))
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const isMatch =
            typeof forbiddenPattern === 'string'
              ? content.includes(forbiddenPattern)
              : forbiddenPattern.test(content);

          expect(
            isMatch,
            `Pelanggaran aturan (${description}) ditemukan di: ${fullPath}`
          ).toBe(false);
        }
      }
    }

    it('DILARANG menggunakan service_role di seluruh kode frontend client', () => {
      checkFilesForPattern(srcDir, 'SUPABASE_SERVICE_ROLE', 'Dilarang menggunakan service_role di frontend');
    });

    it('DILARANG menggunakan karakter em dash (—) di seluruh kode dan teks antarmuka', () => {
      checkFilesForPattern(srcDir, '—', 'Dilarang menggunakan em dash (—)');
    });

    it('DILARANG menggunakan localhost hardcoded di kode sumber', () => {
      checkFilesForPattern(srcDir, 'http://localhost', 'Dilarang hardcode localhost');
    });

    it('DILARANG menyediakan tombol atau provider Apple Login', () => {
      checkFilesForPattern(srcDir, 'provider: \'apple\'', 'Dilarang menggunakan Apple Login');
      checkFilesForPattern(srcDir, 'provider: "apple"', 'Dilarang menggunakan Apple Login');
    });
  });

  describe('4. Verifikasi Struktur Rute & Komponen Admin', () => {
    const adminRoutes = [
      'AdminDashboard.tsx',
      'AdminTemplates.tsx',
      'AdminTemplateDetail.tsx',
      'AdminAnalytics.tsx',
      'AdminUsers.tsx',
      'AdminSettings.tsx',
    ];

    it('seluruh file rute admin tersedia di src/app/routes/admin/', () => {
      const adminDir = path.resolve(__dirname, '../../app/routes/admin');
      expect(fs.existsSync(adminDir)).toBe(true);

      for (const file of adminRoutes) {
        const filePath = path.join(adminDir, file);
        expect(fs.existsSync(filePath), `Berkas ${file} tidak ditemukan di routes/admin`).toBe(true);
      }
    });

    it('AdminRoute dan AdminLayout terpasang di router.tsx', () => {
      const routerPath = path.resolve(__dirname, '../../app/router.tsx');
      const content = fs.readFileSync(routerPath, 'utf-8');

      expect(content).toContain('AdminRoute');
      expect(content).toContain('AdminLayout');
      expect(content).toContain('path: \'admin\'');
      expect(content).toContain('path: \'templates\'');
      expect(content).toContain('path: \'templates/:id\'');
      expect(content).toContain('path: \'analytics\'');
      expect(content).toContain('path: \'users\'');
    });
  });
});
