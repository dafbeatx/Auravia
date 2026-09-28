# Dokumen Audit Sistem Admin Panel Aurovia

**Versi:** 1.0.0  
**Tanggal:** 28 September 2026  
**Status:** Disetujui & Siap Produksi  

---

## 1. Ringkasan Eksekutif & Temuan Audit Repository

Audit komprehensif dilakukan terhadap seluruh repositori Aurovia (`dafbeatx/Auravia`) sebelum dan selama implementasi Admin Panel. Platform Aurovia merupakan layanan undangan digital modern berbasis React, TypeScript, Vite, Tailwind CSS, dan Supabase (PostgreSQL, Auth, Storage, Row Level Security).

### Temuan Utama:
1. **Pemisahan Autentikasi Pengguna & Admin:**
   - Pengguna biasa menggunakan Supabase Auth standar (Email/Password, Magic Link) dengan entitas tabel `auth.users` dan profil `public.users`.
   - Admin platform membutuhkan autentikasi terisolasi penuh tanpa OAuth, tanpa Google/Apple login, dan tanpa mengekspos `service_role` key di sisi peramban (browser).
   - Seluruh verifikasi kredensial admin dan pengelolaan sesi ditangani langsung di database PostgreSQL melalui fungsi `SECURITY DEFINER` dengan hashing kata sandi berbasis algoritma `bf` (Blowfish/bcrypt via ekstensi `pgcrypto`).

2. **Arsitektur RLS & IDOR:**
   - Seluruh tabel database inti (`invitations`, `rsvps`, `wishes`, `guests`, `templates`, `admin_users`, `admin_sessions`, `admin_activity_logs`, `system_settings`, `template_demos`, `analytics_events`) memiliki Row Level Security aktif.
   - Hak akses admin diverifikasi secara server-side via token sesi aktif yang divalidasi oleh RPC `verify_admin_token()`.

3. **Storage & Pengelolaan Aset:**
   - Bucket `template-assets` dan `template-demo-media` dikonfigurasi dengan kuota maksimal 5 MB per berkas serta pembatasan MIME type ketat (`image/jpeg`, `image/png`, `image/webp`). Berkas executable dan SVG ditolak untuk mencegah vektor serangan XSS berbasis SVG.

4. **Kepatuhan Aturan Anti-Slop & Desain Visual:**
   - Karakter em dash (tanda strip panjang / U+2014) dilarang di seluruh kode, antarmuka, dan teks konten.
   - Tipografi menggunakan kurasi font editorial: Cormorant Garamond dan Plus Jakarta Sans.
   - Palet warna konsisten dengan identitas brand Aurovia (Warm Alabaster, Deep Forest `#006A71`, Stone, Charcoal).

---

## 2. Analisis Risiko & Mitigasi Keamanan

| Risiko Potensial | Tingkat Dampak | Strategi Mitigasi Terverifikasi |
|---|---|---|
| Kebocoran `service_role` ke bundle klien | Kritis (Bypass Auth) | Frontend bundle hanya memuat anon key publik. Seluruh aksi berizin tinggi dieksekusi melalui RPC `SECURITY DEFINER` yang memvalidasi sesi token admin. |
| Serangan Brute-Force pada Login Admin | Tinggi (Penebakan Kredensial) | Implementasi rate limiting dan lockout sementara di tabel `admin_login_attempts`. Respon login seragam ("Username atau kata sandi tidak valid") agar tidak membocorkan keberadaan username. |
| Injeksi File Jahat via Storage | Tinggi (XSS/Malware) | MIME-type whitelist ketat (JPEG, PNG, WebP) pada bucket storage Supabase dengan ukuran maksimal 5 MB. |
| Modifikasi Template Platform oleh User Biasa | Tinggi (Integritas Data) | RLS tabel `templates` hanya mengizinkan operasi `SELECT` untuk publik. Operasi `INSERT`, `UPDATE`, dan `DELETE` hanya dapat dilakukan melalui fungsi admin terproteksi token. |
| Kegagalan Token Sesi Admin Kadaluarsa | Sedang (Sesi Tergantung) | Tabel `admin_sessions` memberlakukan kolom `expires_at` (maksimal 24 jam) dan fungsi verifikasi token otomatis menolak sesi yang sudah lewat waktu. |

---

## 3. Audit Schema Database

### A. Schema Existing (Sebelum Admin Panel):
- `public.users`: Profil pengguna terdaftar Aurovia.
- `public.invitations`: Undangan digital milik pengguna.
- `public.rsvps`: Konfirmasi kehadiran tamu undangan.
- `public.wishes`: Ucapan dan doa dari para tamu.
- `public.guests`: Daftar nama tamu khusus untuk undangan personal.
- `public.templates`: Katalog template dasar undangan.

### B. Schema Baru yang Diimplementasikan:
1. `public.admin_users`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `username TEXT UNIQUE NOT NULL`
   - `password_hash TEXT NOT NULL`
   - `display_name TEXT DEFAULT 'Administrator'`
   - `role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin'))`
   - `is_active BOOLEAN NOT NULL DEFAULT true`
   - `last_login_at TIMESTAMPTZ`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

2. `public.admin_sessions`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE`
   - `token_hash TEXT NOT NULL UNIQUE`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `expires_at TIMESTAMPTZ NOT NULL`
   - `user_agent TEXT`
   - `ip_address TEXT`

3. `public.admin_login_attempts`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `username TEXT NOT NULL`
   - `attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `success BOOLEAN NOT NULL DEFAULT false`
   - `ip_address TEXT`

4. `public.admin_activity_logs`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL`
   - `admin_username TEXT NOT NULL`
   - `action TEXT NOT NULL`
   - `target_type TEXT`
   - `target_id TEXT`
   - `metadata JSONB DEFAULT '{}'::jsonb`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

5. `public.system_settings`:
   - `id TEXT PRIMARY KEY DEFAULT 'current'`
   - `site_name TEXT NOT NULL DEFAULT 'Aurovia'`
   - `logo_url TEXT`
   - `favicon_url TEXT`
   - `brand_color TEXT DEFAULT '#006A71'`
   - `contact_email TEXT DEFAULT 'support@aurovia.id'`
   - `social_links JSONB DEFAULT '{"instagram": "", "whatsapp": "", "tiktok": ""}'::jsonb`
   - `landing_content JSONB DEFAULT '{}'::jsonb`
   - `default_seo_title TEXT NOT NULL`
   - `default_seo_description TEXT NOT NULL`
   - `maintenance_mode BOOLEAN NOT NULL DEFAULT false`
   - `registration_enabled BOOLEAN NOT NULL DEFAULT true`
   - `catalog_enabled BOOLEAN NOT NULL DEFAULT true`
   - `analytics_enabled BOOLEAN NOT NULL DEFAULT true`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_by TEXT`

6. `public.template_demos`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE`
   - `hero JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `couple JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `story JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `events JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `gallery JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `quote JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `gift JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `rsvp JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `wishes JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `closing JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

7. `public.analytics_events`:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `event_name TEXT NOT NULL`
   - `path TEXT NOT NULL`
   - `session_id TEXT`
   - `user_id UUID`
   - `invitation_id UUID`
   - `invitation_slug TEXT`
   - `template_id UUID`
   - `template_slug TEXT`
   - `device_category TEXT`
   - `browser_category TEXT`
   - `referrer TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

---

## 4. Audit Routing & Struktur Halaman

### A. Rute Publik & Pengguna (Tetap Berjalan Tanpa Gangguan):
- `/`: Landing page publik interaktif untuk pemasaran, showcase template, fitur, alur kerja, dan FAQ.
- `/login`: Halaman login pengguna aplikasi (mendukung redirect ke demo template atau editor).
- `/register`: Halaman registrasi akun pengguna baru.
- `/templates`: Redirect otomatis ke bagian `#template` di landing page.
- `/demo/:slug` & `/templates/:slug/demo`: Rute demo template terproteksi autentikasi pengguna.
- `/dashboard`: Area ringkasan pengguna terdaftar.
- `/dashboard/invitations/new`: Alur pembuatan undangan baru.
- `/dashboard/invitations/:id`: Editor undangan lengkap pengguna.
- `/i/:slug`: Akses publik undangan digital penerima tamu.

### B. Rute Administrator:
- `/admin/login`: Halaman login khusus admin berbasis username dan password.
- `/admin` & `/admin/dashboard`: Ringkasan metrik statistik real database dan grafik traffic platform.
- `/admin/content`: Modul pengelolaan konten landing page (headline, CTA, cards, FAQ, hero image).
- `/admin/templates`: Manajemen katalog template platform (buat, edit, aktivasi, urutan, thumbnail).
- `/admin/templates/:id`: Detail konfigurasi template (identitas, tema visual, demo section).
- `/admin/templates/:id/media`: Manajemen media foto khusus template terkait.
- `/admin/media`: Pustaka media platform lintas template dengan filter, pencarian, dan pratinjau.
- `/admin/traffic`: Analisis traffic, pengunjung unik, popularitas template, dan grafik per hari.
- `/admin/users`: Pengelolaan akun pengguna platform dan akun admin (khusus Super Admin).
- `/admin/activity`: Riwayat audit log seluruh aksi administrator.
- `/admin/settings`: Pengaturan konfigurasi platform, SEO default, warna brand, kontak, dan mode pemeliharaan.
- `/admin/accounts`: Manajemen akun administrator dan pembuatan admin baru (khusus Super Admin).

---

## 5. Audit Row Level Security (RLS) & Storage Policies

### Row Level Security:
- `admin_users`: Akses langsung dari anon dan authenticated ditolak total (`USING (false)`).
- `admin_sessions`: Akses langsung ditolak total. Verifikasi hanya terjadi di dalam RPC `SECURITY DEFINER`.
- `admin_activity_logs`: Akses langsung ditolak total. Pembacaan riwayat hanya dapat diakses melalui RPC `get_admin_activity_logs()`.
- `system_settings`: Publik hanya dapat membaca (`SELECT`). Pembaruan dibatasi pada fungsi `admin_update_system_settings()` yang memeriksa status `super_admin`.
- `template_demos`: Publik hanya dapat membaca data demo (`SELECT`). Pembaruan dibatasi pada fungsi `admin_save_template_demo()`.
- `analytics_events`: Publik anon dan pengguna dapat menyisipkan log traffic (`INSERT`), namun hanya admin terverifikasi yang dapat membaca agregasi statistiknya.

### Storage Buckets & Policies:
- Bucket `template-assets`:
  - Visibilitas: Publik (`public: true`).
  - Ukuran maksimal: 5.242.880 byte (5 MB).
  - Tipe MIME yang diizinkan: `image/jpeg`, `image/png`, `image/webp`.
  - Akses baca: Publik terbuka untuk rendering template.
  - Akses tulis/hapus: Dibatasi melalui verifikasi admin.
- Bucket `template-demo-media`:
  - Visibilitas: Publik (`public: true`).
  - Ukuran maksimal: 5.242.880 byte (5 MB).
  - Tipe MIME yang diizinkan: `image/jpeg`, `image/png`, `image/webp`.

---

## 6. Arsitektur Autentikasi Admin Terisolasi

```
+-----------------------------------------------------------+
|                    Browser / Client                       |
|   /admin/login  -->  Input: username & password           |
|                      (Never stored in plain-text/URL)     |
+-----------------------------+-----------------------------+
                              |
                     RPC Call (HTTPS POST)
                     admin_authenticate(username, password)
                              |
                              v
+-----------------------------------------------------------+
|               PostgreSQL (Supabase Backend)               |
|  1. Cek rate limit di admin_login_attempts                |
|  2. Ambil admin_users WHERE username = p_username         |
|  3. Verifikasi: extensions.crypt(password, password_hash) |
|  4. Generate secure hex token (pgcrypto)                  |
|  5. Simpan hash token di admin_sessions (24h expiry)      |
|  6. Log aktivitas 'login' di admin_activity_logs          |
|  7. Return { token, admin: { id, username, role } }       |
+-----------------------------+-----------------------------+
                              |
                     Response (JSON)
                              v
+-----------------------------------------------------------+
|                    Browser / Client                       |
|  1. Simpan session token di sessionStorage                |
|  2. AdminAuthContext mengaktifkan status terotentikasi    |
|  3. Akses rute admin terlindungi (/admin/*) diizinkan     |
+-----------------------------------------------------------+
```

---

## 7. Rencana Implementasi & Eksekusi Fase

- **Fase 1 (Audit & Perencanaan):** Penyusunan dokumen audit komprehensif, validasi tidak ada regresi pada fitur pengguna.
- **Fase 2 (Database & Autentikasi Admin):** Tabel `admin_users`, `admin_sessions`, `admin_login_attempts`, hashing password dengan Blowfish pgcrypto, RPC autentikasi.
- **Fase 3 (Layout & Dashboard Admin):** `AdminLayout`, `AdminDashboard` dengan statistik database real dan diagram traffic.
- **Fase 4 (Template Management):** CRUD katalog template, visual theme builder, duplikasi template.
- **Fase 5 (Demo Media & Template Demos):** Pengaturan foto demo terisolasi dari data user asli.
- **Fase 6 (Landing Content & Media Library):** Modul `/admin/content` dan `/admin/media` untuk kustomisasi halaman beranda dan aset gambar.
- **Fase 7 (Traffic Analytics):** Modul `/admin/traffic` dengan filter rentang tanggal dan agregasi database.
- **Fase 8 (Manajemen Akun Admin):** Modul `/admin/users` dan `/admin/accounts` khusus Super Admin.
- **Fase 9 (Audit Logging & Security Hardening):** Tabel `admin_activity_logs`, antarmuka riwayat log aktivitas, proteksi IDOR, dan audit bundle bebas `service_role`.
- **Fase 10 (Pengujian & Verifikasi Produksi):** Pengujian menyeluruh dengan Vitest, ESLint, TypeScript, dan Vite production build.
