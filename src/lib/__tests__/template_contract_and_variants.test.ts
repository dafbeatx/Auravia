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
  royalNavyGoldTemplate,
} from '@/lib/template/definitions';
import {
  getSectionVariantComponent,
  resolveSections,
} from '@/lib/template/SectionRegistry';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { HeroSection } from '@/components/template/sections/HeroSection';
import { HeroRoyalSection } from '@/components/template/sections/HeroRoyalSection';
import { CoupleSection } from '@/components/template/sections/CoupleSection';
import { CoupleRoyalSection } from '@/components/template/sections/CoupleRoyalSection';
import { EventSection } from '@/components/template/sections/EventSection';
import { EventGlassCardSection } from '@/components/template/sections/EventGlassCardSection';
import { QuoteIslamicSection } from '@/components/template/sections/QuoteIslamicSection';
import { GiftDigitalEnvelopeSection } from '@/components/template/sections/GiftDigitalEnvelopeSection';
import { GalleryRoyalSection } from '@/components/template/sections/GalleryRoyalSection';
import { ClosingRoyalSection } from '@/components/template/sections/ClosingRoyalSection';
import { InvitationRenderer } from '@/components/template/InvitationRenderer';

describe('Aurovia Scalable Template Architecture & Quality Gates', () => {
  // 1. Template definition valid
  it('1. Template definition valid untuk classic-elegance dan royal-navy-gold', () => {
    expect(classicEleganceTemplate).toBeDefined();
    expect(classicEleganceTemplate.id).toBe('classic-elegance');
    expect(classicEleganceTemplate.slug).toBe('classic-elegance');
    expect(classicEleganceTemplate.name).toBe('Classic Elegance');
    expect(classicEleganceTemplate.category).toBe('wedding');
    expect(classicEleganceTemplate.defaultTheme).toBeDefined();
    expect(classicEleganceTemplate.capabilities).toBeDefined();
    expect(classicEleganceTemplate.capabilities.coverEnvelope).toBe(true);

    expect(royalNavyGoldTemplate).toBeDefined();
    expect(royalNavyGoldTemplate.id).toBe('royal-navy-gold');
    expect(royalNavyGoldTemplate.slug).toBe('royal-navy-gold');
    expect(royalNavyGoldTemplate.name).toBe('Royal Navy & Gold');
    expect(royalNavyGoldTemplate.category).toBe('wedding');
    expect(royalNavyGoldTemplate.defaultTheme.colorBackground).toBe('#0A1324');
    expect(royalNavyGoldTemplate.defaultTheme.colorAccent).toBe('#D4AF37');
    expect(royalNavyGoldTemplate.capabilities.countdown).toBe(true);
    expect(royalNavyGoldTemplate.capabilities.coverEnvelope).toBe(true);
    expect(isTemplateDefined('royal-navy-gold')).toBe(true);
    expect(isTemplateDefined('classic-elegance')).toBe(true);
    expect(getAllTemplateDefinitions().length).toBeGreaterThanOrEqual(2);
  });

  // 2. Classic template backward compatibility
  it('2. Classic template backward compatibility terjaga', () => {
    const classicDef = getTemplateDefinition('classic-elegance');
    expect(classicDef.slug).toBe('classic-elegance');
    expect(classicDef.sectionVariants['hero']).toBe('editorial');

    const heroComp = getSectionVariantComponent('hero', undefined, classicDef);
    expect(heroComp).toBe(HeroSection);

    const coupleComp = getSectionVariantComponent('couple', undefined, classicDef);
    expect(coupleComp).toBe(CoupleSection);

    const eventComp = getSectionVariantComponent('event', undefined, classicDef);
    expect(eventComp).toBe(EventSection);
  });

  // 3. Variant resolver
  it('3. Variant resolver bekerja secara tepat untuk seluruh seksi royal', () => {
    expect(getSectionVariantComponent('hero', 'royal', royalNavyGoldTemplate)).toBe(HeroRoyalSection);
    expect(getSectionVariantComponent('couple', 'royal', royalNavyGoldTemplate)).toBe(CoupleRoyalSection);
    expect(getSectionVariantComponent('hosts', 'royal', royalNavyGoldTemplate)).toBe(CoupleRoyalSection);
    expect(getSectionVariantComponent('event', 'glass', royalNavyGoldTemplate)).toBe(EventGlassCardSection);
    expect(getSectionVariantComponent('events', 'glass', royalNavyGoldTemplate)).toBe(EventGlassCardSection);
    expect(getSectionVariantComponent('quote', 'islamic', royalNavyGoldTemplate)).toBe(QuoteIslamicSection);
    expect(getSectionVariantComponent('gift', 'royal', royalNavyGoldTemplate)).toBe(GiftDigitalEnvelopeSection);
    expect(getSectionVariantComponent('gallery', 'royal', royalNavyGoldTemplate)).toBe(GalleryRoyalSection);
    expect(getSectionVariantComponent('closing', 'royal', royalNavyGoldTemplate)).toBe(ClosingRoyalSection);
  });

  // 4. Unknown variant fallback
  it('4. Unknown variant fallback ke default variant yang sah', () => {
    const heroUnknown = getSectionVariantComponent('hero', 'completely-unknown-variant-xyz');
    expect(heroUnknown).toBe(HeroSection);

    const coupleUnknown = getSectionVariantComponent('couple', 'unknown-variant-999');
    expect(coupleUnknown).toBe(CoupleSection);
  });

  // 5. Null variant fallback
  it('5. Null dan undefined variant fallback dengan aman', () => {
    const heroNull = getSectionVariantComponent('hero', null as unknown as string);
    expect(heroNull).toBe(HeroSection);

    const heroUndefined = getSectionVariantComponent('hero', undefined);
    expect(heroUndefined).toBe(HeroSection);

    const heroFromTemplate = getSectionVariantComponent('hero', undefined, royalNavyGoldTemplate);
    expect(heroFromTemplate).toBe(HeroRoyalSection);
  });

  // 6. Section ordering
  it('6. Section ordering diurutkan menaik (ASC) berdasarkan display_order', () => {
    const rawSections = [
      { type: 'closing', order: 5, enabled: true },
      { type: 'hero', order: 0, enabled: true },
      { type: 'events', order: 2, enabled: true },
      { type: 'hosts', order: 1, enabled: true },
    ];

    const resolved = resolveSections(rawSections);
    expect(resolved.map((s) => s.section_type)).toEqual(['hero', 'hosts', 'events', 'closing']);
    expect(resolved.map((s) => s.display_order)).toEqual([0, 1, 2, 5]);

    const result = resolveTemplateConfig({
      defaultThemeRaw: null,
      defaultSectionsRaw: rawSections,
    });
    expect(result.sections.map((s) => s.section_type)).toEqual(['hero', 'hosts', 'events', 'closing']);
  });

  // 7. Disabled section
  it('7. Disabled section difilter keluar dari rendering', () => {
    const rawSections = [
      { type: 'hero', order: 0, enabled: true },
      { type: 'story', order: 1, enabled: false },
      { type: 'gift', order: 2, enabled: false },
      { type: 'closing', order: 3, enabled: true },
    ];

    const resolved = resolveSections(rawSections);
    expect(resolved).toHaveLength(2);
    expect(resolved.map((s) => s.section_type)).toEqual(['hero', 'closing']);
  });

  // 8. Invitation section ownership
  it('8. Inisialisasi seksi hanya mengizinkan kanonikal section_type untuk mencegah HTTP 400', async () => {
    const { DB_CANONICAL_SECTION_TYPES, normalizeToDbSectionType } = await import('@/lib/invitations');

    expect(DB_CANONICAL_SECTION_TYPES.has('hero')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('hosts')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('events')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('story')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('gallery')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('gift')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('rsvp')).toBe(true);
    expect(DB_CANONICAL_SECTION_TYPES.has('closing')).toBe(true);

    // Wishes dan quote tidak boleh dimasukkan ke invitation_sections database table
    expect(DB_CANONICAL_SECTION_TYPES.has('wishes')).toBe(false);
    expect(DB_CANONICAL_SECTION_TYPES.has('quote')).toBe(false);

    // Normalisasi alias UI ke kanonikal database
    expect(normalizeToDbSectionType('couple')).toBe('hosts');
    expect(normalizeToDbSectionType('event')).toBe('events');
  });

  // 9. Public renderer tidak crash
  it('9. Public renderer tidak crash dengan data minimal', () => {
    const html = renderToStaticMarkup(
      React.createElement(InvitationRenderer, {
        invitation: {
          id: 'test-inv-001',
          title: 'Pernikahan Rika & Dani',
          slug: 'rika-dani',
          status: 'published',
        },
        template: {
          id: 'tpl-classic',
          slug: 'classic-elegance',
          name: 'Classic Elegance',
          category: 'wedding',
        },
        customSections: [],
        content: null,
        events: [],
        gallery: [],
        guest: null,
      })
    );

    expect(html).toContain('Belum ada seksi undangan yang diaktifkan.');
  });

  // 10. Royal template renderer
  it('10. Royal template renderer merender elemen visual Royal Navy & Gold', () => {
    const html = renderToStaticMarkup(
      React.createElement(InvitationRenderer, {
        invitation: {
          id: 'test-inv-royal',
          title: 'The Wedding of Rika & Dani',
          slug: 'rika-dani-royal',
          status: 'published',
        },
        template: {
          id: 'tpl-royal',
          slug: 'royal-navy-gold',
          name: 'Royal Navy & Gold',
          category: 'wedding',
          default_theme: royalNavyGoldTemplate.defaultTheme as unknown as import('@/types/database').Json,
        },
        customSections: [
          {
            section_type: 'hero',
            variant: 'royal',
            display_order: 0,
            is_enabled: true,
          },
          {
            section_type: 'hosts',
            variant: 'royal',
            display_order: 1,
            is_enabled: true,
          },
          {
            section_type: 'events',
            variant: 'glass',
            display_order: 2,
            is_enabled: true,
          },
          {
            section_type: 'closing',
            variant: 'royal',
            display_order: 3,
            is_enabled: true,
          },
        ],
        content: {
          hero: {
            headline: "Walimatul 'Ursy",
            couple_names: 'Rika & Dani',
          },
          hosts: [
            { name: 'Rika Anindita', role: 'Mempelai Wanita' },
            { name: 'Dani Prasetyo', role: 'Mempelai Pria' },
          ],
          cover: {
            enabled: false,
          },
        },
        events: [
          {
            id: 'evt-1',
            title: 'Akad Nikah',
            start_time: '2026-10-15T09:00:00Z',
            end_time: null,
            timezone: 'WIB',
            venue_name: 'Masjid Agung Al-Azhar',
            address: 'Jakarta Selatan',
            maps_url: 'https://maps.google.com',
            is_primary: true,
          },
        ],
        mode: 'editor',
      })
    );

    expect(html).toContain("Walimatul &#x27;Ursy");
    expect(html).toContain('Rika &amp; Dani');
    expect(html).toContain('Akad Nikah');
    expect(html).toContain('Masjid Agung Al-Azhar');
    expect(html).toContain('Buka Google Maps');
    expect(html).toContain('Terima Kasih');
  });

  // 11. Tidak ada service_role dalam bundle
  it('11. Tidak ada kata service_role di seluruh source frontend (src/)', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(
            content.includes('service_role') && !fullPath.includes('__tests__'),
            `Ditemukan service_role di: ${fullPath}`
          ).toBe(false);
          expect(
            content.includes('SUPABASE_SERVICE_ROLE') && !fullPath.includes('__tests__'),
            `Ditemukan SUPABASE_SERVICE_ROLE di: ${fullPath}`
          ).toBe(false);
        }
      }
    }

    checkDir(srcDir);
  });

  // 12. Tidak ada localhost dalam production source
  it('12. Tidak ada URL localhost hardcoded di source production (src/)', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !fullPath.includes('__tests__')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(
            content.includes('http://localhost'),
            `Ditemukan http://localhost di: ${fullPath}`
          ).toBe(false);
          expect(
            content.includes('https://localhost'),
            `Ditemukan https://localhost di: ${fullPath}`
          ).toBe(false);
        }
      }
    }

    checkDir(srcDir);
  });

  // 13. Tidak ada em dash
  it('13. Tidak ada karakter em dash (\u2014) di seluruh source code dan UI (src/)', () => {
    const srcDir = path.resolve(process.cwd(), 'src');

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx|css|html)$/.test(entry.name) && !fullPath.includes('__tests__')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(
            content.includes('\u2014'),
            `Ditemukan karakter em dash di: ${fullPath}`
          ).toBe(false);
        }
      }
    }

    checkDir(srcDir);
  });
});
