import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getSystemSettings,
  updateSystemSettings,
  listAllPlatformMedia,
} from '../admin';
import * as adminAuth from '../adminAuth';

describe('Admin Content, Media Library & Platform Settings Extension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('1. Verifikasi Migration SQL & Schema', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../../supabase/migrations/20260928040000_admin_content_and_platform_customization.sql'
    );

    it('memiliki file migration ekstensi sistem kustomisasi platform', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('menambahkan kolom brand_color, contact_email, social_links, dan landing_content', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('brand_color TEXT DEFAULT');
      expect(sql).toContain('contact_email TEXT DEFAULT');
      expect(sql).toContain('social_links JSONB DEFAULT');
      expect(sql).toContain('landing_content JSONB DEFAULT');
    });

    it('memperbarui RPC get_system_settings dan admin_update_system_settings', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_system_settings');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.admin_update_system_settings');
      expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_system_settings');
      expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.admin_update_system_settings');
    });

    it('mencatat audit log settings_updated pada admin_activity_logs', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('public.log_admin_action');
      expect(sql).toContain('settings_updated');
    });
  });

  describe('2. Client API & Default Fallback', () => {
    it('getSystemSettings mengembalikan fallback default yang lengkap', async () => {
      const settings = await getSystemSettings();
      expect(settings).toBeDefined();
      expect(settings.site_name).toBe('Aurovia');
      expect(settings.brand_color).toBe('#006A71');
      expect(settings.contact_email).toBe('support@aurovia.id');
      expect(settings.social_links).toBeDefined();
      expect(settings.landing_content).toBeDefined();
      expect(settings.landing_content?.hero_headline).toBeDefined();
      expect(settings.landing_content?.section_visibility?.hero).toBe(true);
    });

    it('updateSystemSettings melempar error jika token sesi admin tidak tersedia', async () => {
      vi.spyOn(adminAuth, 'getAdminToken').mockReturnValue(null);
      await expect(
        updateSystemSettings({ site_name: 'Aurovia Baru' })
      ).rejects.toThrow('Sesi admin tidak ditemukan.');
    });

    it('listAllPlatformMedia dapat mengumpulkan media lintas template secara aman', async () => {
      const media = await listAllPlatformMedia();
      expect(Array.isArray(media)).toBe(true);
    });
  });

  describe('3. Kepatuhan Aturan Anti-Slop (No Em Dash)', () => {
    it('DILARANG menggunakan karakter em dash (—) di seluruh kode baru dan halaman admin', () => {
      const filesToCheck = [
        'supabase/migrations/20260928040000_admin_content_and_platform_customization.sql',
        'src/app/routes/admin/AdminContent.tsx',
        'src/app/routes/admin/AdminMedia.tsx',
        'docs/ADMIN_SYSTEM_AUDIT.md',
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(__dirname, '../../../', relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content.includes('—'), `File ${relPath} contains em dash`).toBe(false);
        }
      }
    });
  });
});
