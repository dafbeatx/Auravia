import { describe, expect, it, vi, beforeEach } from 'vitest';
import { normalizeTheme, createThemeStyleVariables } from '@/lib/template/theme';
import { resolveSections, normalizeSectionType, getSectionComponent } from '@/lib/template/SectionRegistry';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { switchInvitationTemplate } from '@/lib/invitations';
import { supabase } from '@/lib/supabase';
import { ValidationError, DatabaseError } from '@/lib/errors';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Royal Navy & Gold Master Template Specification & Integration Tests', () => {
  const ROYAL_NAVY_GOLD_DEFAULT_THEME = {
    font_heading: 'Playfair Display',
    font_body: 'Plus Jakarta Sans',
    color_background: '#0A1324',
    color_primary: '#F8FAFC',
    color_foreground: '#F8FAFC',
    color_surface: '#132238',
    color_border: '#D4AF37',
    color_accent: '#D4AF37',
    button_radius: 'pill',
    card_radius: 'rounded',
    decorative_style: 'classic',
  };

  const ROYAL_NAVY_GOLD_DEFAULT_SECTIONS = [
    { type: 'hero', order: 0, enabled: true },
    { type: 'quote', order: 1, enabled: true },
    { type: 'hosts', order: 2, enabled: true },
    { type: 'events', order: 3, enabled: true },
    { type: 'story', order: 4, enabled: true },
    { type: 'gallery', order: 5, enabled: true },
    { type: 'gift', order: 6, enabled: true },
    { type: 'rsvp', order: 7, enabled: true },
    { type: 'wishes', order: 8, enabled: true },
    { type: 'closing', order: 9, enabled: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Theme Normalization & CSS Variables for Royal Navy & Gold', () => {
    it('menghasilkan tema terstruktur yang valid dari default_theme Royal Navy & Gold', () => {
      const normalized = normalizeTheme(ROYAL_NAVY_GOLD_DEFAULT_THEME, {});

      expect(normalized.fontHeading).toBe('Playfair Display');
      expect(normalized.fontBody).toBe('Plus Jakarta Sans');
      expect(normalized.colorBackground).toBe('#0A1324');
      expect(normalized.colorPrimary).toBe('#F8FAFC');
      expect(normalized.colorSurface).toBe('#132238');
      expect(normalized.colorBorder).toBe('#D4AF37');
      expect(normalized.colorAccent).toBe('#D4AF37');
      expect(normalized.buttonRadius).toBe('pill');
      expect(normalized.cardRadius).toBe('rounded');
      expect(normalized.decorativeStyle).toBe('classic');
    });

    it('menghasilkan variabel CSS yang lengkap untuk ThemeInjector', () => {
      const normalized = normalizeTheme(ROYAL_NAVY_GOLD_DEFAULT_THEME, {});
      const cssVars = createThemeStyleVariables(normalized);

      expect(cssVars).toHaveProperty('--theme-color-bg', '#0A1324');
      expect(cssVars).toHaveProperty('--theme-color-surface', '#132238');
      expect(cssVars).toHaveProperty('--theme-color-accent', '#D4AF37');
      expect(cssVars).toHaveProperty('--theme-color-border', '#D4AF37');
      expect(cssVars).toHaveProperty('--theme-color-secondary', '#1E3A5F');
      expect(cssVars).toHaveProperty('--theme-color-accent-soft', '#F6E09C');
      expect(cssVars).toHaveProperty('--theme-radius-button', '9999px');
      expect(cssVars).toHaveProperty('--theme-radius-card', '16px');
      expect(cssVars).toHaveProperty('--theme-border-style', 'solid');
    });

    it('mendukung format konfigurasi tema dengan alias kunci seperti background, primary, accent, heading_font, body_font', () => {
      const promptFormatTheme = {
        background: '#0A1324',
        primary: '#1E3A5F',
        accent: '#D4AF37',
        accent_soft: '#F6E09C',
        text: '#F8FAFC',
        border: '#D4AF37',
        heading_font: 'Playfair Display',
        body_font: 'Outfit',
      };

      const normalized = normalizeTheme(promptFormatTheme, {});

      expect(normalized.fontHeading).toBe('Playfair Display');
      expect(normalized.fontBody).toBe('Outfit');
      expect(normalized.colorBackground).toBe('#0A1324');
      expect(normalized.colorPrimary).toBe('#1E3A5F');
      expect(normalized.colorForeground).toBe('#F8FAFC');
      expect(normalized.colorBorder).toBe('#D4AF37');
      expect(normalized.colorAccent).toBe('#D4AF37');
      expect(normalized.colorAccentSoft).toBe('#F6E09C');

      const cssVars = createThemeStyleVariables(normalized);
      expect(cssVars).toHaveProperty('--theme-color-bg', '#0A1324');
      expect(cssVars).toHaveProperty('--theme-color-border', '#D4AF37');
      expect(cssVars).toHaveProperty('--theme-color-accent', '#D4AF37');
      expect(cssVars).toHaveProperty('--theme-color-accent-soft', '#F6E09C');
      expect(cssVars).toHaveProperty('--theme-font-heading', expect.stringContaining('Playfair Display'));
      expect(cssVars).toHaveProperty('--theme-font-body', expect.stringContaining('Outfit'));
    });

    it('mempertahankan tema identik antara mode public dan editor', () => {
      const publicResolved = resolveTemplateConfig({
        defaultThemeRaw: ROYAL_NAVY_GOLD_DEFAULT_THEME,
        themeOverrideRaw: null,
        defaultSectionsRaw: ROYAL_NAVY_GOLD_DEFAULT_SECTIONS,
      });

      const editorResolved = resolveTemplateConfig({
        defaultThemeRaw: ROYAL_NAVY_GOLD_DEFAULT_THEME,
        themeOverrideRaw: undefined,
        defaultSectionsRaw: ROYAL_NAVY_GOLD_DEFAULT_SECTIONS,
      });

      expect(publicResolved.theme).toEqual(editorResolved.theme);
      expect(publicResolved.sections).toEqual(editorResolved.sections);
    });
  });

  describe('2. Section Resolution & Registry Compatibility', () => {
    it('memetakan seluruh seksi default Royal Navy & Gold ke SectionRegistry yang sah', () => {
      const resolved = resolveSections(ROYAL_NAVY_GOLD_DEFAULT_SECTIONS);

      expect(resolved).toHaveLength(10);
      expect(resolved.map((s) => s.section_type)).toEqual([
        'hero',
        'quote',
        'hosts',
        'events',
        'story',
        'gallery',
        'gift',
        'rsvp',
        'wishes',
        'closing',
      ]);

      resolved.forEach((section) => {
        const component = getSectionComponent(section.section_type);
        expect(component).toBeDefined();
        expect(normalizeSectionType(section.section_type)).not.toBe('');
      });
    });

    it('mendukung alias quran dan verse ke seksi quote', () => {
      expect(normalizeSectionType('quran')).toBe('quote');
      expect(normalizeSectionType('verse')).toBe('quote');
      const quoteComponent = getSectionComponent('quran');
      expect(quoteComponent).toBeDefined();
    });

    it('mengurutkan seksi secara menaik sesuai display_order', () => {
      const unorderedSections = [
        { type: 'closing', order: 8, enabled: true },
        { type: 'hero', order: 0, enabled: true },
        { type: 'hosts', order: 1, enabled: true },
      ];

      const resolved = resolveSections(unorderedSections);
      expect(resolved[0]?.section_type).toBe('hero');
      expect(resolved[1]?.section_type).toBe('hosts');
      expect(resolved[2]?.section_type).toBe('closing');
    });
  });

  describe('3. Template Switching Integrity (switchInvitationTemplate)', () => {
    const validInvitationId = '77777777-7777-4777-8777-777777777777';
    const targetTemplateId = '88888888-8888-4888-8888-888888888888';

    it('berhasil mengganti template ke Royal Navy & Gold dan mempertahankan data konten undangan', async () => {
      // Mock verifikasi template aktif di Supabase
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: targetTemplateId,
            slug: 'royal-navy-gold',
            name: 'Royal Navy & Gold',
            is_active: true,
          },
          error: null,
        }),
      };

      // Mock update invitation di Supabase
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: validInvitationId,
            template_id: targetTemplateId,
          },
          error: null,
        }),
      };

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'templates') return mockTemplateQuery;
        if (table === 'invitations') return mockUpdateQuery;
        return {};
      });

      await switchInvitationTemplate(validInvitationId, targetTemplateId);

      expect(mockTemplateQuery.eq).toHaveBeenCalledWith('id', targetTemplateId);
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: targetTemplateId,
        })
      );
    });

    it('menolak pergantian jika template tujuan tidak aktif atau tidak ditemukan', async () => {
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockTemplateQuery);

      await expect(
        switchInvitationTemplate(validInvitationId, targetTemplateId)
      ).rejects.toThrow(ValidationError);
    });

    it('menangani kegagalan database saat pergantian template', async () => {
      const mockTemplateQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: targetTemplateId, is_active: true },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB connection error', code: '500' },
        }),
      };

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'templates') return mockTemplateQuery;
        if (table === 'invitations') return mockUpdateQuery;
        return {};
      });

      await expect(
        switchInvitationTemplate(validInvitationId, targetTemplateId)
      ).rejects.toThrow(DatabaseError);
    });
  });
});
