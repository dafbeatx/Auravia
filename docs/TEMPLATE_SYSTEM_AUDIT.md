# AUROVIA TEMPLATE SYSTEM v1: ARCHITECTURE AUDIT & SPECIFICATION

Dokumen ini merupakan hasil audit teknis mendalam terhadap sistem template undangan digital Aurovia. Dokumen ini menjadi dasar dan pedoman arsitektur untuk membangun Template Engine v1 yang scalable, terisolasi, dan data-driven sebelum mengimplementasikan template baru seperti Royal Navy & Gold.

---

## 1. CURRENT ARCHITECTURE

### 1.1 Representasi Template Saat Ini
Saat ini template direpresentasikan dalam dua lapisan yang terpisah tanpa adanya TypeScript Code Manifest:
- **Database Layer (`public.templates`)**:
  Template disimpan sebagai baris database dengan kolom:
  - `id`: UUID (Primary Key)
  - `slug`: Text unik (misal `classic-elegance`, `royal-navy-gold`)
  - `name`: Nama tampilan template
  - `category`: Enum category (`wedding`, `birthday`, `corporate`, `general`)
  - `description`: Deskripsi ringkas template
  - `thumbnail_url`: Path gambar pratinjau kartu
  - `default_theme`: Kolom JSONB yang menyimpan konfigurasi warna dan font
  - `default_sections`: Kolom JSONB yang menyimpan array urutan dan status aktif seksi
  - `is_active`: Boolean status visibilitas di katalog
- **Frontend Code Layer (`src/lib/template/*`)**:
  Hanya terdapat tipe data TypeScript generik (`TemplateRow`, `TemplateTheme`, `NormalizedTheme`, `SectionConfig`) dan fungsi pembantu normalisasi. Tidak ada katalog deklaratif di memori frontend yang mendefinisikan layout, varian seksi, sistem ornamen, maupun kemampuan fungsional (*capabilities*) dari suatu template.

### 1.2 Mekanisme Pemilihan dan Pengurutan Seksi (Section Selection)
Alur pemilihan seksi saat ini dikelola oleh `resolveTemplateConfig()` di `src/lib/template/resolution.ts`:
1. Menerima `invitationSections` (dari tabel `invitation_sections`) atau fallback ke `defaultSectionsRaw` (dari tabel `templates.default_sections`).
2. Melakukan filter seksi yang aktif (`is_enabled === true`).
3. Mengurutkan seksi secara ascending (`display_order ASC`).
4. Di dalam `InvitationRenderer.tsx`, array seksi aktif di-loop dan komponen seksi dicari menggunakan `getSectionComponent(section.section_type)`.

### 1.3 Penerapan Tema (Theme Application)
Penerapan tema dijalankan oleh `ThemeInjector.tsx` bersama `theme.ts`:
1. `normalizeTheme()` menggabungkan `default_theme` template master dengan `theme_override` milik undangan:
   `invitation override > template default > fallback aman`.
2. `createThemeStyleVariables()` memetakan token tema ke CSS Custom Properties:
   - `--theme-font-heading`
   - `--theme-font-body`
   - `--theme-color-bg`
   - `--theme-color-primary`
   - `--theme-color-secondary`
   - `--theme-color-foreground`
   - `--theme-color-surface`
   - `--theme-color-border`
   - `--theme-color-accent`
   - `--theme-color-accent-soft`
   - `--theme-radius-button`
   - `--theme-radius-card`
   - `--theme-border-style`
3. Variabel CSS tersebut diinjeksikan secara scoped pada elemen `<article>` pembungkus undangan.
4. Komponen seksi membaca token ini melalui class Tailwind CSS seperti `bg-[var(--theme-color-surface)]`.

### 1.4 Penerapan Varian Seksi (Section Variant Status)
**Status saat ini: Varian mati (non-fungsional di tingkat presentasi visual).**
- Meskipun interface `SectionConfig` dan `RegisteredSection` memiliki field `variant: string` dan `availableVariants: string[]`, fungsi `getSectionComponent(type: string)` di `SectionRegistry.ts` hanya menerima parameter `type`.
- Seluruh komponen seksi di `src/components/template/sections/` (`HeroSection.tsx`, `CoupleSection.tsx`, `EventSection.tsx`, dll.) menerima prop `variant` dari `SectionRendererProps`, tetapi tidak ada satu pun komponen yang membaca atau mencabangkan tampilan berdasarkan prop `variant` tersebut.
- Setiap tipe seksi hanya memiliki satu komponen monolitik.

### 1.5 Aliran Masuk Data Undangan (Data Flow)
Aliran data undangan dari database hingga ke komponen:
```
Supabase DB (invitations, invitation_data, events, gallery_items, guests, invitation_sections)
  ↓
API Service Layer (src/lib/invitations.ts, src/lib/events.ts, src/lib/gallery.ts, src/lib/guests.ts)
  ↓
Route Layer (InvitationDetail.tsx untuk Editor atau PublicInvitationView.tsx untuk Publik)
  ↓
InvitationRenderer.tsx (Menerima normalizedInvitation, content, events, gallery, guest, template, sections)
  ↓
SectionRendererProps (Didistribusikan ke masing-masing komponen seksi melalui loop activeSections)
```

---

## 2. PROBLEMS

1. **Komponen Seksi Monolitik & Pencampuran Gaya (Style Contamination)**:
   Karena tidak adanya sistem dispatch varian, elemen visual spesifik suatu desain (seperti ornamen diamond `✦ ♦ ✦` atau monogram ring) terpaksa di-hardcode ke dalam komponen utama seksi. Template apa pun yang menggunakan seksi tersebut akan otomatis mewarisi elemen visual tersebut.
2. **Ketiadaan Multi-Variant Dispatch pada Section Registry**:
   `SectionRegistry.ts` saat ini hanya berupa peta satu dimensi: `Map<string, RegisteredSection>`. Tidak ada hierarki dua tingkat: `sectionType -> variant -> Component`.
3. **Inkonsistensi Database Check Constraint**:
   Di file migrasi awal `20260924000000_initial_schema.sql`, tabel `public.invitation_sections` memiliki constraint:
   `CONSTRAINT check_section_type CHECK (section_type IN ('hero', 'hosts', 'events', 'story', 'gallery', 'gift', 'rsvp', 'closing'))`.
   Constraint ini tidak mencakup tipe `'quote'` dan `'wishes'`. Namun pada template `royal-navy-gold` dan fungsi inisialisasi default seksi di `src/lib/invitations.ts`, tipe `'quote'` dan `'wishes'` dicoba dimasukkan ke tabel `invitation_sections`. Hal ini berisiko menimbulkan kegagalan database saat pengguna membuat undangan baru.
4. **Renderer Menampung Logika Bisnis & Tata Letak Tertentu (Layout Leaks)**:
   Di dalam `InvitationRenderer.tsx`:
   - Logika pengecekan rekening warisan (`content.financial_accounts`) versus struktur baru (`content.gift.accounts`) berada langsung di dalam loop render.
   - Mobile bottom navigation bar di-hardcode dengan target ID DOM statis (`hero`, `couple`, `event`, `gallery`, `gift`, `rsvp`, `wishes`), bukan diatur oleh konfigurasi template capabilities.
5. **Biaya Pembuatan Template Baru Sangat Mahal**:
   Setiap template baru yang memiliki tata letak berbeda mengharuskan developer mengubah komponen yang sudah digunakan oleh template lama, sehingga memicu risiko regresi tinggi.

---

## 3. HARDCODED AREAS

Berikut adalah daftar bagian yang saat ini ter-hardcode untuk satu gaya desain:

1. **Ornamen Diamond Klasik (`✦ ♦ ✦`)**:
   Di-hardcode secara statis pada tajuk seksi di file:
   - `src/components/template/sections/HeroSection.tsx` (baris 95-99)
   - `src/components/template/sections/CoupleSection.tsx` (baris 18-22)
   - `src/components/template/sections/QuoteSection.tsx` (baris 33-37)
   - `src/components/template/sections/EventSection.tsx` (baris 17-21)
   - `src/components/template/sections/StorySection.tsx` (baris 22-26)
   - `src/components/template/sections/GallerySection.tsx` (baris 19-23)
   - `src/components/template/sections/GiftSection.tsx` (baris 102-106)
   - `src/components/template/sections/RsvpSection.tsx` (baris 143-147)
   - `src/components/template/sections/WishesSection.tsx` (baris 147-151)
   - `src/components/template/sections/ClosingSection.tsx` (baris 16-20)
2. **Kutipan Ayat Suci Default**:
   Di `QuoteSection.tsx` (baris 4-12), ayat QS. Ar-Rum: 21 di-hardcode sebagai fallback permanen jika `content.quote` kosong. Desain non-Islami atau umum tetap menampilkan ayat ini.
3. **Monogram Dashed Ring**:
   Di `CoupleSection.tsx` (baris 58-69), styling monogram berbentuk lingkaran dengan border dashed di-hardcode di dalam JSX.
4. **Mobile Bottom Navigation Bar**:
   Di `InvitationRenderer.tsx` (baris 240-342), tombol navigasi bawah (Cover, Mempelai, Acara, Galeri, Kado, Ucapan) di-hardcode dengan scroll target dan ikon statis.
5. **Footer Aurovia Branding**:
   Di `ClosingSection.tsx` (baris 30-32), teks `AUROVIA • ELEGANT DIGITAL INVITATION` di-hardcode di dalam komponen seksi penutup.

---

## 4. REUSABLE AREAS

Berikut adalah bagian yang sudah bersih, modular, dan dapat dipakai ulang tanpa perubahan:

1. **ThemeInjector & CSS Custom Properties Engine (`src/lib/template/theme.ts`)**:
   Sistem injeksi variabel CSS scoped ke container undangan bekerja dengan sangat baik, aman dari injeksi warna/font berbahaya, dan tidak membebani render cycle.
2. **Model Data Undangan Bisnis (Data Layer)**:
   - Tabel `invitations`, `invitation_data`, `events`, `gallery_items`, dan `guests` benar-benar generik dan agnostik terhadap visual.
   - Kolom JSONB `content` pada `invitation_data` menyimpan data struktural (hosts, story, accounts, cover, quote) tanpa kontaminasi styling.
3. **CoverEnvelope Logic (`src/components/template/CoverEnvelope.tsx`)**:
   Manajemen pembukaan sampul, integrasi gesture audio untuk background music, dan penghormatan preferensi sistem operasi (`prefers-reduced-motion`) sudah solid.
4. **MusicPlayer (`src/components/template/MusicPlayer.tsx`)**:
   Komponen pemutar audio mengambang yang mandiri, taat kebijakan autoplay browser modern, dan hanya bergantung pada data `content.music`.
5. **Rsvp & Wishes Logic (`src/lib/rsvps.ts`)**:
   Penanganan formulir RSVP, kuota pax tamu personal, validasi server, dan sistem event sinkronisasi ucapan (`aurovia:wishes-updated`) sudah bersih dari styling template.
6. **Storage URL Generator (`src/lib/invitations.ts`)**:
   Fungsi `getGalleryPublicUrl()` menyediakan URL publik CDN Supabase secara deterministik dan aman.

---

## 5. PROPOSED ARCHITECTURE (TEMPLATE SYSTEM v1)

### 5.1 Pipeline Eksekusi
```
[Database Record: templates]
         │
         ▼
[Template Definition Manifest (TypeScript)]
  - identity (id, slug, name, category, description)
  - theme (typography, colors, radii, borders)
  - decorativeSystem (ornaments, dividers, frames)
  - layout (maxWidth, spacing, bottomNavStyle)
  - sections (order, type, variant, defaultEnabled)
  - capabilities (coverEnvelope, monogram, countdown)
         │
         ▼
[Template Resolution Engine]
  - Menggabungkan Template Definition + Database Record + Invitation Overrides
  - Menghasilkan NormalizedTheme & ResolvedSections
         │
         ▼
[Section Registry (Multi-Variant Engine)]
  - getSectionVariantComponent(type, variant)
  - Fallback berjenjang: requested variant -> default variant -> first available -> fallback
         │
         ▼
[Pure Invitation Data] (Agnostik visual: couple, events, gallery, story, rsvp, gift)
         │
         ▼
[InvitationRenderer] (Orchestrator murni)
```

### 5.2 Kontrak Template Definition
Setiap template didefinisikan sebagai manifest TypeScript yang strongly-typed di folder `src/lib/template/definitions/`:

```typescript
export interface TemplateDefinition {
  identity: {
    slug: string;
    name: string;
    category: 'wedding' | 'birthday' | 'corporate' | 'general';
    description: string;
    thumbnailUrl: string;
    version: string;
  };
  theme: {
    fontHeading: string;
    fontBody: string;
    colorBackground: string;
    colorForeground: string;
    colorPrimary: string;
    colorSecondary: string;
    colorSurface: string;
    colorBorder: string;
    colorAccent: string;
    colorAccentSoft: string;
    buttonRadius: 'pill' | 'rounded' | 'sharp';
    cardRadius: 'rounded' | 'subtle' | 'sharp';
    decorativeStyle: 'classic' | 'minimal' | 'bordered';
  };
  decorativeSystem: {
    divider: 'diamond' | 'line' | 'monogram' | 'none';
    frameStyle: 'gold-bordered' | 'card' | 'flat';
  };
  layout: {
    maxWidth: '2xl' | '3xl' | '4xl';
    bottomNavStyle: 'floating' | 'docked' | 'none';
  };
  sections: Array<{
    type: string;
    variant: string;
    order: number;
    enabled: boolean;
  }>;
  capabilities: {
    supportsCoverEnvelope: boolean;
    supportsMonogram: boolean;
    supportsCountdown: boolean;
    supportsMusic: boolean;
  };
}
```

### 5.3 Sistem Registrasi Varian Seksi (Section Registry v1)
Registry menyimpan peta 2 tingkat:
```typescript
interface SectionRegistryEntry {
  type: string;
  name: string;
  defaultVariant: string;
  variants: Record<string, ComponentType<SectionRendererProps>>;
}
```

Struktur varian target untuk Aurovia:
- `hero`:
  - `editorial`: Hero klasik dengan judul besar dan countdown minimal (Classic Elegance).
  - `royal`: Hero dark navy dengan gold monogram frame dan countdown kartu kaca (Royal Navy & Gold).
  - `minimal`: Hero berpusat teks tanpa ornamen.
- `couple`:
  - `cards`: Kartu profil mempelai berdampingan dengan foto portrait (Classic Elegance).
  - `monogram`: Profil megah dengan ornamen monogram inisial melingkar beraksen emas (Royal Navy & Gold).
  - `split`: Profil dengan pembagian layout asimetris.
- `quote`:
  - `classic`: Kutipan mutiara netral untuk pernikahan umum.
  - `islamic`: Ayat Al-Qur'an (QS. Ar-Rum: 21) dengan kaligrafi dan terjemahan.
  - `minimal`: Teks kutipan satu baris berpusat.
- `event`:
  - `cards`: Kartu agenda standar (Classic Elegance).
  - `glass-card`: Kartu agenda dengan background semi-transparan dan aksen border emas (Royal Navy & Gold).
- `story`:
  - `timeline`: Garis linimasa vertikal klasik.
  - `timeline-gold`: Garis linimasa emas dengan node penanda khusus.
- `gallery`:
  - `grid`: Grid foto proporsional 3 kolom.
  - `masonry`: Tata letak foto staggered yang artistik.
- `gift`:
  - `cards`: Kartu rekening dengan tombol salin nomor.
  - `digital-envelope`: Tampilan amplop digital bertema royal dengan aksen rekening terstruktur.
- `rsvp`:
  - `standard`: Formulir konfirmasi kehadiran bersih.
  - `royal-form`: Formulir dengan aksen border dan tombol emas mewah.
- `wishes`:
  - `list`: Daftar ucapan dan doa berurutan vertikal.
  - `guestbook`: Buku ucapan dengan kartu doa bergaya kartu tamu eksklusif.
- `closing`:
  - `simple`: Salam penutup klasik.
  - `royal-closing`: Penutup dengan ornamen monogram dan ucapan syukur resmi.

---

## 6. DATABASE ASSESSMENT

### Apakah Struktur Database Saat Ini Sudah Cukup?
**YA, struktur tabel database Aurovia saat ini sudah lebih dari cukup.**
1. **Tabel `templates`**:
   - Memiliki kolom `default_theme` (JSONB) dan `default_sections` (JSONB).
   - Seluruh varian seksi dapat disimpan di dalam elemen `default_sections`:
     `[{"type": "hero", "variant": "royal", "order": 0, "enabled": true}, ...]`.
   - Tidak perlu menambahkan kolom baru ke tabel `templates`.
2. **Tabel `invitations`**:
   - Memiliki kolom `theme_override` (JSONB) untuk menampung kustomisasi warna dan font personal pengguna.
   - Tidak perlu penambahan kolom.
3. **Tabel `invitation_data`**:
   - Memiliki kolom `content` (JSONB) yang menampung data bisnis (hosts, story, accounts, quote, cover, music).
   - Bersih dari styling presentasi.
4. **Tabel `invitation_sections`**:
   - Sudah memiliki kolom `section_type: string`, `variant: string`, `display_order: integer`, `is_enabled: boolean`, `custom_config: jsonb`.
   - Desain kolom ini sudah ideal sejak awal.

---

## 7. MIGRATION REQUIREMENTS

### Analisis Kebutuhan Migrasi
Tidak diperlukan migrasi DDL besar (tidak ada tabel baru atau penghapusan tabel).

**Satu-satunya Penyesuaian Database yang Perlu Dilakukan:**
Pada migrasi awal `20260924000000_initial_schema.sql`, terdapat check constraint pada `invitation_sections`:
`CONSTRAINT check_section_type CHECK (section_type IN ('hero', 'hosts', 'events', 'story', 'gallery', 'gift', 'rsvp', 'closing'))`.

Kendala:
Seksi `'quote'` dan `'wishes'` tidak terdaftar pada check constraint tersebut, sehingga insert langsung ke tabel `invitation_sections` untuk seksi ini akan gagal jika ada record kustom yang dimasukkan.

**Solusi Arsitektural Tanpa Migrasi Mendesak (Safe Handling):**
1. Di tingkat `SectionRegistry.ts`, aliasing sudah tersedia:
   - `hosts` -> `couple`
   - `events` -> `event`
   - `quran` -> `quote`
2. Pada Template Resolution Layer:
   Jika undangan belum memiliki baris kustom di `invitation_sections`, engine membaca langsung dari `templates.default_sections` (JSONB) tanpa perlu melakukan insert baris ke `invitation_sections`.
3. Jika di masa mendatang pengguna ingin mengubah urutan seksi secara kustom lewat UI editor, sebuah migrasi ringan dapat dibuat untuk memperbarui check constraint:
   ```sql
   ALTER TABLE public.invitation_sections
     DROP CONSTRAINT IF EXISTS check_section_type;

   ALTER TABLE public.invitation_sections
     ADD CONSTRAINT check_section_type
     CHECK (section_type IN ('hero', 'hosts', 'couple', 'events', 'event', 'story', 'gallery', 'gift', 'rsvp', 'wishes', 'quote', 'closing'));
   ```
   *Catatan: Migrasi ini tidak diperlukan untuk Phase 1-4.*

---

## 8. RISKS & MITIGATION

| Risiko | Dampak | Strategi Mitigasi |
|---|---|---|
| **Regresi Template `classic-elegance`** | Tampilan undangan yang sudah beredar di production berubah atau rusak. | Komponen lama dipertahankan sebagai varian `editorial` / `cards` / `timeline` / `grid`. Pengujian visual dilakukan sebelum dan sesudah refactor. |
| **Pencemaran Data Undangan** | Nilai styling masuk ke tabel `invitation_data`. | Validasi ketat pada API dan contract: data undangan hanya berisi teks dan media murni. |
| **Error Rendering Akibat Varian Hilang** | Halaman undangan publik blank jika varian tidak terdaftar. | Sistem fallback 4 lapis: `requested variant -> defaultVariant -> first available variant -> UnknownSectionFallback`. |
| **Egress & Performance Bloat** | Ukuran bundle membesar atau konsumsi bandwidth Supabase melonjak. | Sistem dekorasi hanya menggunakan inline SVG terkontrol dan CSS native; tidak menggunakan aset gambar eksternal yang besar atau dependensi animasi berat. |
| **Inkompatibilitas Editor** | Editor menjadi rumit dengan branching logika template. | Editor tetap generik, hanya bertugas mengedit data bisnis dan memilih tema via `TemplateSelectorTab`. |

---

## 9. RECOMMENDED IMPLEMENTATION ORDER

Pelaksanaan refactor dilakukan secara berurutan dan terukur:

```
[Phase 1: Audit & Specification] (Selesai pada dokumen ini)
       │
       ▼
[Phase 2: Template Contract & Types]
  - Update src/lib/template/types.ts
  - Definisikan TemplateDefinition & SectionVariantMap
       │
       ▼
[Phase 3: Multi-Variant Section Registry & Reusable Ornaments]
  - Update src/lib/template/SectionRegistry.ts
  - Buat folder src/components/template/ornaments/ (DecorativeDivider, MonogramFrame, GoldLine)
  - Bungkus komponen eksisting sebagai varian Classic Elegance
       │
       ▼
[Phase 4: Template Registry & Manifests]
  - Buat src/lib/template/definitions/classicElegance.ts
  - Buat src/lib/template/definitions/index.ts (getTemplateDefinition)
       │
       ▼
[Phase 5: Renderer Integration]
  - Perbarui InvitationRenderer.tsx untuk menggunakan getSectionVariantComponent()
  - Hubungkan Bottom Navigation Bar ke Template Capabilities
       │
       ▼
[Phase 6: Royal Navy & Gold Implementation]
  - Implementasikan varian visual: HeroRoyal, CoupleMonogram, EventGlassCard, QuoteIslamic, GiftDigitalEnvelope
  - Buat src/lib/template/definitions/royalNavyGold.ts
       │
       ▼
[Phase 7: Validation & Verification]
  - Typecheck (tsc --noEmit)
  - Unit & Integration Tests (vitest)
  - Production Build (vite build)
  - Visual Browser Subagent Verification (Mobile 390px, Desktop)
```

---

## 10. JAWABAN SPESIFIK ATAS 10 PERTANYAAN AUDIT

1. **Bagian mana yang hardcoded untuk satu desain?**
   Ornamen diamond `✦ ♦ ✦` pada 10 file seksi, teks ayat QS. Ar-Rum: 21 di `QuoteSection.tsx`, monogram inner ring di `CoupleSection.tsx`, dan daftar item bottom navigation di `InvitationRenderer.tsx`.
2. **Bagian mana yang sudah reusable?**
   `ThemeInjector.tsx`, utilitas `normalizeTheme()`, komponen `MusicPlayer.tsx`, mekanisme interaksi `CoverEnvelope.tsx`, helper `getGalleryPublicUrl()`, dan seluruh tabel data bisnis di database.
3. **Bagian mana yang seharusnya menjadi template configuration?**
   Palet warna default, tipografi heading/body, dekorasi divider, urutan seksi default, varian default tiap seksi, gaya bottom navigation bar, dan kapabilitas template (dukungan cover, monogram, countdown).
4. **Bagian mana yang seharusnya menjadi section variant?**
   Hero (editorial vs royal), Couple (cards vs monogram), Quote (classic vs islamic), Event (cards vs glass-card), Story (timeline vs timeline-gold), Gallery (grid vs masonry), Gift (cards vs digital-envelope), RSVP (standard vs royal-form), Wishes (list vs guestbook), Closing (simple vs royal-closing).
5. **Bagian mana yang merupakan shared invitation data?**
   Judul undangan, slug, tanggal dan waktu acara, nama tempat, alamat, URL Google Maps, nama mempelai, nama orang tua, kisah perjalanan (story), foto galeri, nomor rekening bank / e-wallet, data RSVP tamu, ucapan doa, file musik latar, dan data tamu undangan (guest).
6. **Bagian mana yang merupakan visual-only configuration?**
   Warna background, warna primer/aksen, jenis font, radius tombol/kartu, style garis pembatas, style frame monogram, dan animasi transisi.
7. **Apakah template baru dapat dibuat tanpa mengubah InvitationRenderer.tsx?**
   Setelah refactor: **YA**. Template baru hanya perlu mendaftarkan varian komponen ke `SectionRegistry` dan membuat satu file `TemplateDefinition`. `InvitationRenderer.tsx` tidak disentuh sama sekali.
8. **Apakah template baru dapat dibuat tanpa membuat renderer baru dari nol?**
   **YA**. Template baru memanfaatkan `InvitationRenderer` yang sama sebagai orchestrator, dengan komposisi varian dan tema yang berbeda.
9. **Apakah template-specific CSS/design token dapat diisolasi?**
   **YA**. Token tema diisolasi melalui CSS Custom Properties di dalam `ThemeInjector.tsx`, dan kelas layout spesifik diisolasi di dalam masing-masing file varian seksi.
10. **Apakah struktur database saat ini sudah cukup?**
    **YA**. Kolom JSONB `default_theme` dan `default_sections` pada tabel `templates` sudah mencukupi untuk menyimpan konfigurasi varian dan token tema tanpa perlu migrasi DDL baru.
