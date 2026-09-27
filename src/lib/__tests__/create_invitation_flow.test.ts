import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createInvitation,
  getActiveTemplates,
  suggestSlugFromTitle,
  generateSlug,
  initializeInvitationSectionsFromTemplate,
  updateInvitationSections,
  updateInvitationSection,
} from '@/lib/invitations';
import { resolveTemplateConfig } from '@/lib/template/resolution';
import { supabase } from '@/lib/supabase';
import { ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from '@/lib/errors';

/**
 * Suite Pengujian Unit untuk Fitur "Create Invitation Flow" (Wizard v1)
 *
 * Menguji:
 * 1. Template aktif dapat dipilih, template nonaktif ditolak
 * 2. Validasi judul (1-120 karakter)
 * 3. Validasi slug (format regex, panjang 3-60 karakter, lowercase)
 * 4. Pembangkitan saran slug dari judul secara lokal
 * 5. Penanganan tabrakan slug (duplicate key error 23505)
 * 6. Pembuatan draft undangan dengan status 'draft' dan template_id yang tepat
 * 7. Perlindungan otorisasi (anonymous user tidak dapat membuat undangan)
 * 8. Penanganan error RLS dan database
 */

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('1. Pembangkitan Saran Slug (suggestSlugFromTitle & generateSlug)', () => {
  it('menghasilkan slug dari judul dengan huruf kecil dan tanda hubung', () => {
    expect(suggestSlugFromTitle('Rizky & Aulia Wedding')).toBe('rizky-aulia-wedding');
    expect(suggestSlugFromTitle('The Wedding of Dimas & Sarah')).toBe('the-wedding-of-dimas-sarah');
    expect(suggestSlugFromTitle('Syukuran 17 Tahun Anindya')).toBe('syukuran-17-tahun-anindya');
  });

  it('membersihkan tanda hubung di awal dan di akhir', () => {
    expect(suggestSlugFromTitle('---Undangan Spesial---')).toBe('undangan-spesial');
    expect(suggestSlugFromTitle('   Spasi Depan dan Belakang   ')).toBe('spasi-depan-dan-belakang');
  });

  it('memotong panjang maksimal slug saran hingga 60 karakter', () => {
    const longTitle = 'Pernikahan Sangat Megah dan Mewah Antara Keluarga Besar Dua Insan yang Berbahagia Sepanjang Masa';
    const suggested = suggestSlugFromTitle(longTitle);
    expect(suggested.length).toBeLessThanOrEqual(60);
    expect(suggested).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('mengembalikan string kosong jika judul hanya berisi simbol', () => {
    expect(suggestSlugFromTitle('!@#$%^&*()_+')).toBe('');
  });

  it('generateSlug menghasilkan slug dengan suffix acak yang valid', () => {
    const slug = generateSlug('Romeo & Juliet');
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slug.startsWith('romeo-juliet-')).toBe(true);
  });
});

describe('2. Pengambilan Katalog Template Aktif (getActiveTemplates)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('meminta template aktif dengan filter is_active = true dalam 1 query', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'tpl-1',
          slug: 'classic-elegance',
          name: 'Classic Elegance',
          category: 'wedding',
          description: 'Desain klasik',
          thumbnail_url: '/thumb.webp',
          default_theme: {},
          is_active: true,
        },
      ],
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof supabase.from>);

    const templates = await getActiveTemplates();

    expect(supabase.from).toHaveBeenCalledWith('templates');
    expect(mockSelect).toHaveBeenCalledWith('id, slug, name, category, description, thumbnail_url, default_theme, default_sections, is_active');
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(templates).toHaveLength(1);
    expect(templates[0]?.name).toBe('Classic Elegance');
  });

  it('melempar DatabaseError jika query template gagal', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database failure' },
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof supabase.from>);

    await expect(getActiveTemplates()).rejects.toThrow(DatabaseError);
  });
});

describe('3. Validasi Input Pembuatan Undangan (createInvitation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'usr-123', email: 'user@example.com' } as unknown as import('@supabase/supabase-js').User },
      error: null,
    });
  });

  it('menolak jika judul kosong atau hanya spasi', async () => {
    await expect(
      createInvitation({ title: '   ', templateId: 'tpl-1' })
    ).rejects.toThrow(ValidationError);
    await expect(
      createInvitation({ title: '', templateId: 'tpl-1' })
    ).rejects.toThrow('Judul undangan wajib diisi.');
  });

  it('menolak jika judul melebihi 120 karakter', async () => {
    const longTitle = 'A'.repeat(121);
    await expect(
      createInvitation({ title: longTitle, templateId: 'tpl-1' })
    ).rejects.toThrow('Judul undangan maksimal 120 karakter.');
  });

  it('menolak jika templateId kosong', async () => {
    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: '   ' })
    ).rejects.toThrow('Silakan pilih salah satu template yang tersedia.');
  });

  it('menolak jika pengguna belum terautentikasi (anonymous user)', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as unknown as import('@supabase/supabase-js').UserResponse);

    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'tpl-1' })
    ).rejects.toThrow(AuthenticationError);
  });

  it('menolak jika template tidak ditemukan di database', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof supabase.from>);

    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'non-existent-tpl' })
    ).rejects.toThrow('Template yang dipilih tidak ditemukan.');
  });

  it('menolak jika template berstatus tidak aktif (is_active = false)', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'tpl-inactive', is_active: false },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof supabase.from>);

    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'tpl-inactive' })
    ).rejects.toThrow('Template yang dipilih sedang tidak aktif.');
  });

  it('menolak jika format kustom slug tidak sesuai aturan regex', async () => {
    // Template aktif valid
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'tpl-active', is_active: true },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as unknown as ReturnType<typeof supabase.from>);

    // Slug terlalu pendek (< 3 karakter)
    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'tpl-active', slug: 'ab' })
    ).rejects.toThrow(ValidationError);

    // Slug mengandung huruf kapital atau spasi atau karakter ilegal
    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'tpl-active', slug: 'Invalid Slug' })
    ).rejects.toThrow(ValidationError);

    await expect(
      createInvitation({ title: 'Pernikahan Budi & Ani', templateId: 'tpl-active', slug: 'slug_with_underscore' })
    ).rejects.toThrow(ValidationError);
  });
});

describe('4. Penyimpanan Undangan Sebagai Draft (createInvitation persistence)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'usr-456', email: 'owner@example.com' } as unknown as import('@supabase/supabase-js').User },
      error: null,
    });
  });

  it('berhasil menyimpan draft undangan dengan template_id, slug, dan event_type', async () => {
    // 1. Mock verifikasi template aktif
    const mockTmplMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tpl-classic',
        is_active: true,
        default_sections: [{ type: 'hero', order: 0, enabled: true }],
      },
      error: null,
    });
    const mockTmplEq = vi.fn().mockReturnValue({ maybeSingle: mockTmplMaybeSingle });
    const mockTmplSelect = vi.fn().mockReturnValue({ eq: mockTmplEq });

    // 2. Mock insert invitation
    const createdRecord = {
      id: 'inv-new-999',
      slug: 'rizky-sarah-wedding',
      title: 'Pernikahan Rizky & Sarah',
      event_type: 'Pernikahan',
      status: 'draft',
      template_id: 'tpl-classic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: createdRecord, error: null });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsertInvitation = vi.fn().mockReturnValue({ select: mockInsertSelect });

    // 3. Mock insert invitation_data
    const mockInsertData = vi.fn().mockResolvedValue({ error: null });

    // 4. Mock sections
    const mockSectionsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSectionsEq = vi.fn().mockReturnValue({ order: mockSectionsOrder });
    const mockSectionsSelect = vi.fn().mockReturnValue({ eq: mockSectionsEq });
    const mockSectionsInsertOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSectionsInsertSelect = vi.fn().mockReturnValue({ order: mockSectionsInsertOrder });
    const mockSectionsInsert = vi.fn().mockReturnValue({ select: mockSectionsInsertSelect });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'templates') {
        return { select: mockTmplSelect } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitations') {
        return { insert: mockInsertInvitation } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitation_data') {
        return { insert: mockInsertData } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitation_sections') {
        return {
          select: mockSectionsSelect,
          insert: mockSectionsInsert,
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    const result = await createInvitation({
      title: 'Pernikahan Rizky & Sarah',
      templateId: 'tpl-classic',
      slug: 'rizky-sarah-wedding',
      eventType: 'Pernikahan',
      coupleNames: 'Sarah & Rizky',
    });

    expect(mockInsertInvitation).toHaveBeenCalledWith({
      user_id: 'usr-456',
      template_id: 'tpl-classic',
      title: 'Pernikahan Rizky & Sarah',
      slug: 'rizky-sarah-wedding',
      event_type: 'Pernikahan',
      status: 'draft',
      allow_rsvp: true,
      show_wishes: true,
    });
    expect(result.id).toBe('inv-new-999');
    expect(result.status).toBe('draft');
    expect(result.slug).toBe('rizky-sarah-wedding');

    // Memverifikasi bahwa invitation_data dibuat dengan struktur yang tepat
    expect(mockInsertData).toHaveBeenCalledWith({
      invitation_id: 'inv-new-999',
      content: expect.objectContaining({
        hero: expect.objectContaining({
          headline: 'Pernikahan Rizky & Sarah',
          couple_names: 'Sarah & Rizky',
        }),
        hosts: expect.arrayContaining([
          expect.objectContaining({ name: 'Sarah', role: 'Mempelai Pria' }),
          expect.objectContaining({ name: 'Rizky', role: 'Mempelai Wanita' }),
        ]),
        cover: expect.objectContaining({
          enabled: true,
          title: 'Sarah & Rizky',
          subtitle: 'Pernikahan',
        }),
      }),
    });
  });

  it('menginisialisasi seksi bawaan template pada tabel invitation_sections', async () => {
    const mockTmplMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tpl-classic',
        is_active: true,
        default_sections: [
          { type: 'hero', order: 0, enabled: true },
          { type: 'events', order: 1, enabled: true },
        ],
      },
      error: null,
    });
    const mockTmplEq = vi.fn().mockReturnValue({ maybeSingle: mockTmplMaybeSingle });
    const mockTmplSelect = vi.fn().mockReturnValue({ eq: mockTmplEq });

    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'inv-sec-101', slug: 'sarah-dimas', status: 'draft' },
      error: null,
    });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsertInvitation = vi.fn().mockReturnValue({ select: mockInsertSelect });
    const mockInsertData = vi.fn().mockResolvedValue({ error: null });

    const mockSectionsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSectionsEq = vi.fn().mockReturnValue({ order: mockSectionsOrder });
    const mockSectionsSelect = vi.fn().mockReturnValue({ eq: mockSectionsEq });

    const mockSectionsInsertOrder = vi.fn().mockResolvedValue({
      data: [
        { id: 'sec-1', section_type: 'hero', display_order: 0, is_enabled: true },
        { id: 'sec-2', section_type: 'events', display_order: 1, is_enabled: true },
      ],
      error: null,
    });
    const mockSectionsInsertSelect = vi.fn().mockReturnValue({ order: mockSectionsInsertOrder });
    const mockSectionsInsert = vi.fn().mockReturnValue({ select: mockSectionsInsertSelect });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'templates') return { select: mockTmplSelect } as unknown as ReturnType<typeof supabase.from>;
      if (table === 'invitations') return { insert: mockInsertInvitation } as unknown as ReturnType<typeof supabase.from>;
      if (table === 'invitation_data') return { insert: mockInsertData } as unknown as ReturnType<typeof supabase.from>;
      if (table === 'invitation_sections') {
        return {
          select: mockSectionsSelect,
          insert: mockSectionsInsert,
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await createInvitation({
      title: 'Pernikahan Sarah & Dimas',
      templateId: 'tpl-classic',
      slug: 'sarah-dimas',
    });

    expect(mockSectionsInsert).toHaveBeenCalled();
  });

  it('melakukan rollback cleanup dengan menghapus invitation jika pembuatan data/seksi gagal', async () => {
    const mockTmplMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tpl-classic',
        is_active: true,
        default_sections: [{ type: 'hero', order: 0, enabled: true }],
      },
      error: null,
    });
    const mockTmplEq = vi.fn().mockReturnValue({ maybeSingle: mockTmplMaybeSingle });
    const mockTmplSelect = vi.fn().mockReturnValue({ eq: mockTmplEq });

    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'inv-to-rollback', slug: 'rollback-test', status: 'draft' },
      error: null,
    });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsertInvitation = vi.fn().mockReturnValue({ select: mockInsertSelect });

    // Mock kegagalan saat insert invitation_data
    const mockInsertData = vi.fn().mockResolvedValue({
      error: { message: 'Gagal insert invitation_data' },
    });

    // Mock delete cleanup
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteInvitation = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'templates') return { select: mockTmplSelect } as unknown as ReturnType<typeof supabase.from>;
      if (table === 'invitations') {
        return {
          insert: mockInsertInvitation,
          delete: mockDeleteInvitation,
        } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitation_data') return { insert: mockInsertData } as unknown as ReturnType<typeof supabase.from>;
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await expect(
      createInvitation({
        title: 'Pernikahan Uji Rollback',
        templateId: 'tpl-classic',
        slug: 'rollback-test',
      })
    ).rejects.toThrow(DatabaseError);

    // Memverifikasi bahwa rollback delete dipanggil untuk ID undangan yang bersangkutan
    expect(mockDeleteInvitation).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'inv-to-rollback');
  });

  it('menangani konflik tabrakan slug (error code 23505) dengan pesan ramah', async () => {
    const mockTmplMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'tpl-classic', is_active: true },
      error: null,
    });
    const mockTmplEq = vi.fn().mockReturnValue({ maybeSingle: mockTmplMaybeSingle });
    const mockTmplSelect = vi.fn().mockReturnValue({ eq: mockTmplEq });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'templates') {
        return { select: mockTmplSelect } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitations') {
        return { insert: mockInsert } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await expect(
      createInvitation({
        title: 'Pernikahan Sarah & Rizky',
        templateId: 'tpl-classic',
        slug: 'sarah-rizky',
      })
    ).rejects.toThrow('Tautan (slug) undangan sudah digunakan oleh undangan lain. Silakan pilih tautan yang berbeda.');
  });

  it('menangani error izin RLS denied secara aman', async () => {
    const mockTmplMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'tpl-classic', is_active: true },
      error: null,
    });
    const mockTmplEq = vi.fn().mockReturnValue({ maybeSingle: mockTmplMaybeSingle });
    const mockTmplSelect = vi.fn().mockReturnValue({ eq: mockTmplEq });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'new row violates row-level security policy' },
    });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'templates') {
        return { select: mockTmplSelect } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === 'invitations') {
        return { insert: mockInsert } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await expect(
      createInvitation({
        title: 'Pernikahan Sarah & Rizky',
        templateId: 'tpl-classic',
      })
    ).rejects.toThrow(AuthorizationError);
  });
});

describe('5. Arsitektur Pratinjau Desain Template Lokal (Template Preview Experience)', () => {
  it('menyelesaikan seksi pratinjau template dari default_sections tanpa query database', () => {
    const rawTemplate = {
      default_theme: {
        font_heading: 'Cormorant Garamond',
        font_body: 'Plus Jakarta Sans',
        color_primary: '#292524',
        color_background: '#FAF9F6',
      },
      default_sections: [
        { type: 'hero', order: 0, enabled: true },
        { type: 'hosts', order: 1, enabled: true },
        { type: 'events', order: 2, enabled: true },
      ],
    };

    const resolved = resolveTemplateConfig({
      defaultThemeRaw: rawTemplate.default_theme,
      defaultSectionsRaw: rawTemplate.default_sections,
    });

    expect(resolved.theme.fontHeading).toBe('Cormorant Garamond');
    expect(resolved.theme.fontBody).toBe('Plus Jakarta Sans');
    expect(resolved.sections).toHaveLength(3);
    expect(resolved.sections[0]?.section_type).toBe('hero');
  });

  it('memvalidasi format slug secara lokal: hanya lowercase, angka, dan tanda hubung', () => {
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    // Valid slugs
    expect(slugRegex.test('sarah-rizky')).toBe(true);
    expect(slugRegex.test('wedding2026')).toBe(true);
    expect(slugRegex.test('the-wedding-of-sarah-and-rizky')).toBe(true);

    // Invalid slugs
    expect(slugRegex.test('Sarah-Rizky')).toBe(false); // uppercase
    expect(slugRegex.test('sarah rizky')).toBe(false); // space
    expect(slugRegex.test('sarah_rizky')).toBe(false); // underscore
    expect(slugRegex.test('-sarah-rizky')).toBe(false); // leading dash
    expect(slugRegex.test('sarah-rizky-')).toBe(false); // trailing dash
    expect(slugRegex.test('sarah--rizky')).toBe(false); // double dash
    expect(slugRegex.test('')).toBe(false); // empty
  });
});

describe('Audit & Persistensi invitation_sections (Anti-HTTP 400 & Multi-Variant)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hanya melakukan insert untuk tipe seksi kanonikal database dan menolak tipe non-tabel (quote, wishes)', async () => {
    // Mock getInvitationSections: existing = []
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    // Mock insert
    let capturedRows: unknown = null;
    const mockInsertOrder = vi.fn().mockImplementation(() => ({
      data: capturedRows,
      error: null,
    }));
    const mockInsertSelect = vi.fn().mockReturnValue({ order: mockInsertOrder });
    const mockInsert = vi.fn().mockImplementation((rows) => {
      capturedRows = rows;
      return { select: mockInsertSelect };
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'invitation_sections') {
        return {
          select: mockSelect,
          insert: mockInsert,
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    const rawTemplateSections = [
      { type: 'hero', order: 0, enabled: true },
      { type: 'quote', order: 1, enabled: true }, // Harus difilter (bukan kolom invitation_sections)
      { type: 'couple', order: 2, enabled: true }, // Harus dinormalisasi ke 'hosts'
      { type: 'event', order: 3, enabled: true }, // Harus dinormalisasi ke 'events'
      { type: 'story', order: 4, enabled: true },
      { type: 'gallery', order: 5, enabled: true },
      { type: 'gift', order: 6, enabled: true },
      { type: 'rsvp', order: 7, enabled: true },
      { type: 'wishes', order: 8, enabled: true }, // Harus difilter (disimpan di rsvps.wishes / show_wishes)
      { type: 'closing', order: 9, enabled: true },
    ];

    await initializeInvitationSectionsFromTemplate('inv-test-123', rawTemplateSections);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const firstCall = mockInsert.mock.calls[0];
    expect(firstCall).toBeDefined();
    const inserted = firstCall![0] as Array<{ section_type: string }>;
    
    // Pastikan tidak ada 'quote' atau 'wishes' yang masuk ke payload insert
    const insertedTypes = inserted.map((r) => r.section_type);
    expect(insertedTypes).not.toContain('quote');
    expect(insertedTypes).not.toContain('wishes');
    expect(insertedTypes).not.toContain('couple');
    expect(insertedTypes).not.toContain('event');

    // Pastikan dinormalisasi ke nama kanonikal database
    expect(insertedTypes).toContain('hosts');
    expect(insertedTypes).toContain('events');
    expect(insertedTypes).toEqual(['hero', 'hosts', 'events', 'story', 'gallery', 'gift', 'rsvp', 'closing']);
  });

  it('updateInvitationSections memperbarui display_order, is_enabled, variant, dan custom_config', async () => {
    const mockUpdateEqInv = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateEqId = vi.fn().mockReturnValue({ eq: mockUpdateEqInv });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEqId });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'invitation_sections') {
        return { update: mockUpdate } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await updateInvitationSections('inv-test-123', [
      {
        id: 'sec-1',
        display_order: 0,
        is_enabled: true,
        variant: 'editorial',
        custom_config: { badge: 'VIP' },
      },
    ]);

    expect(mockUpdate).toHaveBeenCalledWith({
      display_order: 0,
      is_enabled: true,
      variant: 'editorial',
      custom_config: { badge: 'VIP' },
    });
  });

  it('updateInvitationSection memperbarui field parsial untuk satu seksi', async () => {
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'invitation_sections') {
        return { update: mockUpdate } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as unknown as ReturnType<typeof supabase.from>;
    });

    await updateInvitationSection('sec-target-id', {
      variant: 'minimal',
      is_enabled: false,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      variant: 'minimal',
      is_enabled: false,
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'sec-target-id');
  });
});
