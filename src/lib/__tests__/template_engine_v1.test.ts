import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getTemplateDefinition,
  isTemplateDefined,
  getAllTemplateDefinitions,
  classicEleganceTemplate,
} from '@/lib/template/definitions';
import {
  getSectionVariantComponent,
  getSectionComponent,
  getRegisteredSection,
  registerSectionVariant,
  normalizeSectionType,
} from '@/lib/template/SectionRegistry';
import { UnknownSectionFallback } from '@/components/template/sections/UnknownSectionFallback';
import { HeroSection } from '@/components/template/sections/HeroSection';
import { CoupleSection } from '@/components/template/sections/CoupleSection';
import {
  DecorativeDivider,
  MonogramFrame,
  SectionEyebrow,
} from '@/components/template/ornaments';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';
import { normalizeTheme, createThemeStyleVariables } from '@/lib/template/theme';

describe('Template Engine v1 - Template Definition Catalog', () => {
  it('dapat me-resolve template definition untuk classic-elegance dengan field deklaratif lengkap', () => {
    const def = getTemplateDefinition('classic-elegance');
    expect(def).toBeDefined();
    expect(def.id).toBe('classic-elegance');
    expect(def.slug).toBe('classic-elegance');
    expect(def.name).toBe('Classic Elegance');
    expect(def.category).toBe('wedding');
    expect(def.description).toContain('editorial');
    expect(def.defaultTheme.fontHeading).toBe('Cormorant Garamond');
    expect(def.defaultTheme.fontBody).toBe('Plus Jakarta Sans');
    expect(def.defaultTheme.colorMuted).toBe('#78716C');
    expect(def.capabilities.supportsCoverEnvelope).toBe(true);
    expect(def.sectionVariants['hero']).toBe('editorial');
    expect(def.defaultSectionOrder).toContain('hero');
    expect(def.sections.length).toBeGreaterThan(0);

    // Backward compatibility identity
    expect(def.identity.slug).toBe('classic-elegance');
  });

  it('dapat diakses melalui catalog facade', async () => {
    const catalog = await import('@/lib/template/catalog');
    expect(catalog.getTemplateDefinition).toBeDefined();
    expect(catalog.classicEleganceTemplate.slug).toBe('classic-elegance');
  });

  it('mengembalikan fallback aman classic-elegance jika slug tidak dikenal atau null', () => {
    const unknownDef = getTemplateDefinition('unknown-random-template');
    expect(unknownDef).toBe(classicEleganceTemplate);

    const nullDef = getTemplateDefinition(null);
    expect(nullDef).toBe(classicEleganceTemplate);

    const emptyDef = getTemplateDefinition('   ');
    expect(emptyDef).toBe(classicEleganceTemplate);
  });

  it('memvalidasi keberadaan template dengan isTemplateDefined', () => {
    expect(isTemplateDefined('classic-elegance')).toBe(true);
    expect(isTemplateDefined('CLASSIC-ELEGANCE')).toBe(true);
    expect(isTemplateDefined('non-existent-template')).toBe(false);
    expect(isTemplateDefined('')).toBe(false);
  });

  it('mengambil seluruh template terdaftar dengan getAllTemplateDefinitions', () => {
    const all = getAllTemplateDefinitions();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((t) => t.slug === 'classic-elegance')).toBe(true);
  });
});

describe('Template Engine v1 - Multi-Variant Section Registry', () => {
  it('me-resolve varian yang valid pada seksi hero dan couple', () => {
    const HeroEditorial = getSectionVariantComponent('hero', 'editorial');
    expect(HeroEditorial).toBe(HeroSection);

    const CoupleCards = getSectionVariantComponent('couple', 'cards');
    expect(CoupleCards).toBe(CoupleSection);
  });

  it('menerapkan fallback deterministik jika varian yang diminta tidak ditemukan', () => {
    // Varian 'non-existent-variant' tidak ada pada hero, harus fallback ke defaultVariant 'editorial'
    const fallbackComponent = getSectionVariantComponent('hero', 'non-existent-variant');
    expect(fallbackComponent).toBe(HeroSection);
  });

  it('menerapkan fallback defaultVariant dari string atau TemplateDefinition object', () => {
    // Dengan fallback string
    const compFromString = getSectionVariantComponent('hero', undefined, 'editorial');
    expect(compFromString).toBe(HeroSection);

    // Dengan TemplateDefinition object
    const compFromDef = getSectionVariantComponent('hero', undefined, classicEleganceTemplate);
    expect(compFromDef).toBe(HeroSection);
  });

  it('mengembalikan UnknownSectionFallback jika seksi sama sekali tidak terdaftar', () => {
    const unknown = getSectionVariantComponent('totally-unknown-section-type');
    expect(unknown).toBe(UnknownSectionFallback);
  });

  it('mendukung alias database (hosts -> couple, events -> event, quran -> quote)', () => {
    expect(normalizeSectionType('hosts')).toBe('couple');
    expect(normalizeSectionType('events')).toBe('event');
    expect(normalizeSectionType('quran')).toBe('quote');

    const hostsComp = getSectionVariantComponent('hosts', 'cards');
    const coupleComp = getSectionVariantComponent('couple', 'cards');
    expect(hostsComp).toBe(coupleComp);

    const eventsComp = getSectionVariantComponent('events', 'cards');
    const eventComp = getSectionVariantComponent('event', 'cards');
    expect(eventsComp).toBe(eventComp);
  });

  it('memungkinkan pendaftaran varian kustom baru secara modular via registerSectionVariant', () => {
    const MockCustomHero: React.FC = () => React.createElement('div', null, 'Mock Custom Hero');

    registerSectionVariant('hero', 'mock-test-variant', MockCustomHero as never);

    const resolved = getSectionVariantComponent('hero', 'mock-test-variant');
    expect(resolved).toBe(MockCustomHero);

    const registered = getRegisteredSection('hero');
    expect(registered?.availableVariants).toContain('mock-test-variant');
  });

  it('menjaga backward compatibility getSectionComponent', () => {
    const comp = getSectionComponent('hero');
    expect(comp).toBe(HeroSection);
  });
});

describe('Template Engine v1 - Reusable Ornament System', () => {
  it('DecorativeDivider merender varian diamond dengan benar', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecorativeDivider, { variant: 'diamond', withLine: true })
    );
    expect(html).toContain('✦');
    expect(html).toContain('♦');
  });

  it('DecorativeDivider merender varian gold dengan benar', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecorativeDivider, { variant: 'gold', withLine: true })
    );
    expect(html).toContain('✦');
    expect(html).toContain('◆');
  });

  it('DecorativeDivider mengembalikan string kosong untuk varian none', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecorativeDivider, { variant: 'none' })
    );
    expect(html).toBe('');
  });

  it('DecorativeDivider merender garis untuk varian minimal', () => {
    const html = renderToStaticMarkup(
      React.createElement(DecorativeDivider, { variant: 'minimal' })
    );
    expect(html).toContain('w-12');
  });

  it('MonogramFrame merender inisial jika photoUrl tidak disediakan', () => {
    const html = renderToStaticMarkup(
      React.createElement(MonogramFrame, { initials: 'R & D', variant: 'classic-ring' })
    );
    expect(html).toContain('R &amp; D');
  });

  it('MonogramFrame merender elemen img jika photoUrl disediakan', () => {
    const html = renderToStaticMarkup(
      React.createElement(MonogramFrame, {
        photoUrl: 'https://example.com/photo.webp',
        alt: 'Foto Pengantin',
      })
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/photo.webp"');
    expect(html).toContain('alt="Foto Pengantin"');
  });

  it('SectionEyebrow merender teks anak dengan benar', () => {
    const html = renderToStaticMarkup(
      React.createElement(SectionEyebrow, null, 'Pernikahan Eksklusif')
    );
    expect(html).toContain('Pernikahan Eksklusif');
  });
});

describe('Template Engine v1 - Renderer Integration', () => {
  const dummyInvitation = {
    id: 'test-invitation-101',
    title: 'Pernikahan Sarah & Dimas',
    slug: 'sarah-dimas',
    eventType: 'Pernikahan',
    status: 'draft',
    allowRsvp: true,
    showWishes: true,
  };

  it('InvitationRenderer berhasil me-render dengan template slug yang tidak dikenal tanpa crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(InvitationRenderer, {
        invitation: dummyInvitation,
        template: {
          id: 'tpl-unknown',
          slug: 'non-existent-template-slug',
          name: 'Template Anonim',
          category: 'wedding',
        },
        customSections: [
          {
            section_type: 'hero',
            variant: 'editorial',
            display_order: 0,
            is_enabled: true,
          },
        ],
        content: {
          hero: {
            headline: 'Sarah & Dimas',
            opening_text: 'Selamat datang',
          },
          cover: {
            enabled: false,
          },
        },
        mode: 'editor',
      })
    );

    expect(html).toContain('id="hero"');
    expect(html).toContain('Sarah &amp; Dimas');
  });

  it('InvitationRenderer menangani seksi kosong tanpa crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(InvitationRenderer, {
        invitation: dummyInvitation,
        template: {
          id: 'tpl-classic',
          slug: 'classic-elegance',
          name: 'Classic Elegance',
          category: 'wedding',
        },
        customSections: [],
        content: {
          cover: {
            enabled: false,
          },
        },
        mode: 'editor',
      })
    );

    expect(html).toContain('Belum ada seksi undangan yang diaktifkan.');
  });
});

describe('Template Engine v1 - Code Hygiene & Security Audit', () => {
  it('memastikan tidak ada service_role yang bocor ke bundle frontend template', () => {
    // Audit string service_role di seluruh file template
    const templateFiles = [
      'src/lib/template/types.ts',
      'src/lib/template/theme.ts',
      'src/lib/template/resolution.ts',
      'src/lib/template/SectionRegistry.ts',
      'src/lib/template/defaults.ts',
      'src/lib/template/definitions/classicElegance.ts',
      'src/lib/template/definitions/index.ts',
      'src/components/template/InvitationRenderer.tsx',
      'src/components/template/ThemeInjector.tsx',
    ];

    for (const relPath of templateFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toContain('service_role');
        expect(content).not.toContain('SUPABASE_SERVICE_ROLE');
      }
    }
  });

  it('memastikan tidak ada URL localhost hardcoded di modul template', () => {
    const templateFiles = [
      'src/lib/template/definitions/classicElegance.ts',
      'src/lib/template/definitions/index.ts',
      'src/lib/template/SectionRegistry.ts',
      'src/components/template/InvitationRenderer.tsx',
    ];

    for (const relPath of templateFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toContain('http://localhost');
        expect(content).not.toContain('https://localhost');
      }
    }
  });

  it('memastikan tidak ada karakter em dash (\u2014) di seluruh file template yang baru dibuat atau diubah', () => {
    const targetFiles = [
      'src/lib/template/types.ts',
      'src/lib/template/SectionRegistry.ts',
      'src/lib/template/defaults.ts',
      'src/lib/template/definitions/classicElegance.ts',
      'src/lib/template/catalog.ts',
      'src/lib/template/definitions/index.ts',
      'src/components/template/InvitationRenderer.tsx',
      'src/components/template/ornaments/DecorativeDivider.tsx',
      'src/components/template/ornaments/MonogramFrame.tsx',
      'src/components/template/ornaments/SectionEyebrow.tsx',
      'src/components/template/ornaments/index.ts',
      'src/components/template/sections/HeroSection.tsx',
      'src/components/template/sections/CoupleSection.tsx',
      'src/components/template/sections/QuoteSection.tsx',
      'src/components/template/sections/EventSection.tsx',
      'src/components/template/sections/StorySection.tsx',
      'src/components/template/sections/GallerySection.tsx',
      'src/components/template/sections/GiftSection.tsx',
      'src/components/template/sections/RsvpSection.tsx',
      'src/components/template/sections/WishesSection.tsx',
      'src/components/template/sections/ClosingSection.tsx',
    ];

    for (const relPath of targetFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toContain('\u2014');
      }
    }
  });

  it('memastikan tidak ada conditional logic template-specific di InvitationRenderer', () => {
    const rendererPath = path.resolve(process.cwd(), 'src/components/template/InvitationRenderer.tsx');
    const content = fs.readFileSync(rendererPath, 'utf-8');

    // Memastikan tidak ada perbandingan template.slug === '...'
    expect(content).not.toMatch(/template\.slug\s*===/);
    expect(content).not.toMatch(/template\s*===\s*['"`]royal/);
    expect(content).not.toMatch(/template\s*===\s*['"`]classic/);
    expect(content).not.toMatch(/variant\s*===\s*['"`]royal/);
  });

  it('memastikan token tema mencakup color-muted dan container-width', () => {
    const normalized = normalizeTheme({
      color_muted: '#8A8A8A',
      container_width: '42rem',
    });

    expect(normalized.colorMuted).toBe('#8A8A8A');
    expect(normalized.containerWidth).toBe('42rem');

    const styles = createThemeStyleVariables(normalized) as Record<string, string>;
    expect(styles['--theme-color-muted']).toBe('#8A8A8A');
    expect(styles['--theme-container-width']).toBe('42rem');
  });
});

