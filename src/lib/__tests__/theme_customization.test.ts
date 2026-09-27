import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  normalizeTheme,
  createThemeStyleVariables,
  DEFAULT_THEME_FALLBACK,
} from '@/lib/template/theme';
import {
  switchInvitationTemplate,
  resetInvitationTheme,
  updateInvitationCore,
} from '@/lib/invitations';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { supabase } from '@/lib/supabase';
import { ValidationError, DatabaseError, AuthorizationError } from '@/lib/errors';
import type { InvitationThemeOverride } from '@/lib/template/types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Aurovia Template & Design Customization System v1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Theme Normalization & Parsing (normalizeTheme)', () => {
    it('menggunakan fallback default yang aman ketika input kosong atau tidak valid', () => {
      const theme = normalizeTheme(null, null);
      expect(theme.fontHeading).toBe(DEFAULT_THEME_FALLBACK.fontHeading);
      expect(theme.fontBody).toBe(DEFAULT_THEME_FALLBACK.fontBody);
      expect(theme.colorBackground).toBe(DEFAULT_THEME_FALLBACK.colorBackground);
      expect(theme.colorPrimary).toBe(DEFAULT_THEME_FALLBACK.colorPrimary);
      expect(theme.buttonRadius).toBe('pill');
      expect(theme.cardRadius).toBe('rounded');
      expect(theme.decorativeStyle).toBe('classic');
    });

    it('menerapkan default_theme dari template master jika tidak ada override', () => {
      const defaultTheme = {
        font_heading: 'Playfair Display',
        font_body: 'Inter',
        color_background: '#F0FDF4',
        color_primary: '#14532D',
        button_radius: 'rounded',
      };

      const theme = normalizeTheme(defaultTheme, {});
      expect(theme.fontHeading).toBe('Playfair Display');
      expect(theme.fontBody).toBe('Inter');
      expect(theme.colorBackground).toBe('#F0FDF4');
      expect(theme.colorPrimary).toBe('#14532D');
      expect(theme.buttonRadius).toBe('rounded');
      // Nilai yang tidak didefinisikan tetap menggunakan fallback aman
      expect(theme.cardRadius).toBe('rounded');
    });

    it('memprioritaskan theme_override di atas default_theme template', () => {
      const defaultTheme = {
        font_heading: 'Cormorant Garamond',
        color_primary: '#292524',
        button_radius: 'pill',
      };
      const themeOverride: InvitationThemeOverride = {
        font_heading: 'Cinzel',
        color_primary: '#1E3A8A',
        button_radius: 'sharp',
      };

      const theme = normalizeTheme(defaultTheme, themeOverride);
      expect(theme.fontHeading).toBe('Cinzel');
      expect(theme.colorPrimary).toBe('#1E3A8A');
      expect(theme.buttonRadius).toBe('sharp');
    });

    it('mendukung kustomisasi parsial tanpa menghapus nilai lainnya', () => {
      const defaultTheme = {
        font_heading: 'Cormorant Garamond',
        font_body: 'Plus Jakarta Sans',
        color_background: '#FAF9F6',
        color_primary: '#292524',
      };
      const themeOverride: InvitationThemeOverride = {
        color_accent: '#B45309',
      };

      const theme = normalizeTheme(defaultTheme, themeOverride);
      expect(theme.fontHeading).toBe('Cormorant Garamond');
      expect(theme.fontBody).toBe('Plus Jakarta Sans');
      expect(theme.colorBackground).toBe('#FAF9F6');
      expect(theme.colorAccent).toBe('#B45309');
    });

    it('membersihkan dan menolak nilai warna berbahaya / script injection', () => {
      const maliciousOverride = {
        color_background: 'red; background: url(javascript:alert(1))',
        color_primary: '<script>alert("xss")</script>',
        font_heading: 'Font"; color: red; --fake: "',
      };

      const theme = normalizeTheme({}, maliciousOverride);
      // Nilai berbahaya ditolak dan dikembalikan ke fallback aman
      expect(theme.colorBackground).toBe(DEFAULT_THEME_FALLBACK.colorBackground);
      expect(theme.colorPrimary).toBe(DEFAULT_THEME_FALLBACK.colorPrimary);
      expect(theme.fontHeading).toBe(DEFAULT_THEME_FALLBACK.fontHeading);
    });

    it('menolak nilai radius atau dekorasi yang tidak terdaftar', () => {
      const invalidOverride = {
        button_radius: 'ultra-circle' as unknown,
        card_radius: 'blob' as unknown,
        decorative_style: 'neon-glow' as unknown,
      };

      const theme = normalizeTheme({}, invalidOverride);
      expect(theme.buttonRadius).toBe('pill');
      expect(theme.cardRadius).toBe('rounded');
      expect(theme.decorativeStyle).toBe('classic');
    });
  });

  describe('2. Pembangkitan Token CSS (createThemeStyleVariables)', () => {
    it('menghasilkan variabel CSS yang lengkap dan terstruktur', () => {
      const theme = normalizeTheme({
        button_radius: 'sharp',
        card_radius: 'subtle',
        decorative_style: 'minimal',
      });

      const styleVars = createThemeStyleVariables(theme);
      expect(styleVars).toHaveProperty('--theme-font-heading');
      expect(styleVars).toHaveProperty('--theme-font-body');
      expect(styleVars).toHaveProperty('--theme-color-bg');
      expect(styleVars).toHaveProperty('--theme-radius-button', '0px');
      expect(styleVars).toHaveProperty('--theme-radius-card', '8px');
      expect(styleVars).toHaveProperty('--theme-border-style', 'none');
    });

    it('menghasilkan radius tombol kapsul 9999px saat memilih pill', () => {
      const theme = normalizeTheme({ button_radius: 'pill' });
      const styleVars = createThemeStyleVariables(theme);
      expect(styleVars).toHaveProperty('--theme-radius-button', '9999px');
    });
  });

  describe('3. Template Switching (switchInvitationTemplate)', () => {
    it('berhasil mengganti template jika template tujuan aktif', async () => {
      const mockTemplateRecord = { id: 'tmpl-2', is_active: true };
      const mockUpdatedInvitation = {
        id: 'inv-1',
        title: 'Undangan Romeo & Juliet',
        slug: 'romeo-juliet',
        template_id: 'tmpl-2',
        theme_override: {},
      };

      // Mock query templates
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockTemplateRecord, error: null }),
      };

      // Mock query update invitation
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockUpdatedInvitation, error: null }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'templates') return mockTemplateQuery as unknown as ReturnType<typeof supabase.from>;
        if (table === 'invitations') return mockUpdateQuery as unknown as ReturnType<typeof supabase.from>;
        return {} as unknown as ReturnType<typeof supabase.from>;
      });

      const result = await switchInvitationTemplate('inv-1', 'tmpl-2');
      expect(result.template_id).toBe('tmpl-2');
      expect(mockTemplateQuery.eq).toHaveBeenCalledWith('id', 'tmpl-2');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ template_id: 'tmpl-2' })
      );
    });

    it('menolak template switching jika ID template kosong', async () => {
      await expect(switchInvitationTemplate('inv-1', '   ')).rejects.toThrow(ValidationError);
    });

    it('menolak template switching jika template tidak ditemukan', async () => {
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockTemplateQuery as unknown as ReturnType<typeof supabase.from>);

      await expect(switchInvitationTemplate('inv-1', 'non-existent-tmpl')).rejects.toThrow(ValidationError);
    });

    it('menolak template switching jika template berstatus tidak aktif', async () => {
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'tmpl-inactive', is_active: false }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockTemplateQuery as unknown as ReturnType<typeof supabase.from>);

      await expect(switchInvitationTemplate('inv-1', 'tmpl-inactive')).rejects.toThrow(ValidationError);
    });
  });

  describe('4. Reset Design (resetInvitationTheme)', () => {
    it('mengirim theme_override kosong {} untuk mengembalikan ke tema bawaan template', async () => {
      const mockResetInvitation = {
        id: 'inv-1',
        title: 'Undangan Romeo & Juliet',
        slug: 'romeo-juliet',
        template_id: 'tmpl-1',
        theme_override: {},
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockResetInvitation, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery as unknown as ReturnType<typeof supabase.from>);

      const result = await resetInvitationTheme('inv-1');
      expect(result.theme_override).toEqual({});
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ theme_override: {} })
      );
    });
  });

  describe('5. Konsistensi Renderer Publik & Editor (resolveTemplateConfig)', () => {
    it('menghasilkan tema yang identik untuk input defaultTheme dan themeOverride yang sama', () => {
      const defaultTheme = {
        font_heading: 'Cormorant Garamond',
        color_primary: '#292524',
        button_radius: 'pill',
      };
      const themeOverride = {
        color_primary: '#3B82F6',
        button_radius: 'rounded' as const,
      };

      const config1 = resolveTemplateConfig({
        defaultThemeRaw: defaultTheme,
        themeOverrideRaw: themeOverride,
      });

      const config2 = resolveTemplateConfig({
        defaultThemeRaw: defaultTheme,
        themeOverrideRaw: themeOverride,
      });

      expect(config1.theme).toEqual(config2.theme);
      expect(config1.theme.colorPrimary).toBe('#3B82F6');
      expect(config1.theme.buttonRadius).toBe('rounded');
    });
  });

  describe('6. Perlindungan Keamanan & Mutasi Ilegal', () => {
    it('gagal memperbarui jika database mengembalikan error otorisasi/RLS', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '42501', message: 'permission denied for table invitations' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery as unknown as ReturnType<typeof supabase.from>);

      await expect(
        updateInvitationCore('inv-unauthorized', {
          theme_override: { color_primary: '#000000' },
        })
      ).rejects.toThrow(DatabaseError);
    });

    it('gagal jika undangan tidak ditemukan atau bukan milik pengguna aktif', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockUpdateQuery as unknown as ReturnType<typeof supabase.from>);

      await expect(
        updateInvitationCore('inv-not-found', {
          theme_override: {},
        })
      ).rejects.toThrow(AuthorizationError);
    });
  });
});
