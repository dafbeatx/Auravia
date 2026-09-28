-- ==============================================================================
-- AUROVIA MIGRATION: 20260928040000_admin_content_and_platform_customization.sql
-- Description: Landing page content management, platform brand color, contact email,
--              social links, and system settings synchronization.
-- ==============================================================================

-- 1. EXTEND SYSTEM SETTINGS TABLE COLUMNS
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#006A71',
  ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'support@aurovia.id',
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"instagram": "https://instagram.com/aurovia.id", "whatsapp": "https://wa.me/6281234567890", "tiktok": "https://tiktok.com/@aurovia.id"}'::jsonb,
  ADD COLUMN IF NOT EXISTS landing_content JSONB DEFAULT '{
    "hero_headline": "Abadikan Momen Sakral dalam Lembaran Digital Abadi",
    "hero_subheadline": "Desain kurasi eksklusif, RSVP terkonfirmasi, dan tata visual anggun untuk pernikahan impian Anda.",
    "hero_cta_text": "Mulai Buat Undangan",
    "hero_cta_link": "/register",
    "secondary_cta_text": "Lihat Katalog Template",
    "secondary_cta_link": "/#template",
    "hero_image_url": "",
    "section_visibility": {
      "hero": true,
      "features": true,
      "template_showcase": true,
      "invitation_preview": true,
      "process": true,
      "faq": true,
      "cta_banner": true
    },
    "features": [
      {
        "id": "feat-1",
        "title": "Desain Tipografi Anggun",
        "description": "Kurasi font serif editorial yang menghadirkan aura sakral dan mewah bagi setiap lembar undangan Anda."
      },
      {
        "id": "feat-2",
        "title": "RSVP & Buku Tamu Real-time",
        "description": "Konfirmasi kehadiran langsung masuk ke dashboard dengan integrasi ucapan selamat dari para kerabat."
      },
      {
        "id": "feat-3",
        "title": "Navigasi Lokasi Interaktif",
        "description": "Integrasi peta Google Maps presisi untuk memudahkan para tamu menemukan lokasi akad dan resepsi."
      },
      {
        "id": "feat-4",
        "title": "Amplop Digital Aman",
        "description": "Fasilitas transfer langsung ke rekening bank atau e-wallet tanpa perantara dengan verifikasi nomor yang jelas."
      }
    ],
    "faq_items": [
      {
        "question": "Berapa lama proses pembuatan undangan di Aurovia?",
        "answer": "Undangan digital dapat selesai dan siap dibagikan dalam waktu kurang dari 10 menit setelah Anda mengisi data acara."
      },
      {
        "question": "Apakah saya dapat mengganti template setelah undangan dibuat?",
        "answer": "Ya, Anda dapat beralih antar template kapan saja tanpa kehilangan data pengantin atau daftar acara yang sudah diinput."
      },
      {
        "question": "Bagaimana cara menyebarkan undangan ke tamu personal?",
        "answer": "Aurovia menyediakan generator tautan personal (misal: /i/raka-aulia?to=Nama+Tamu) sehingga nama tamu tertera manis pada sampul pembuka."
      },
      {
        "question": "Apakah tamu memerlukan aplikasi untuk membuka undangan?",
        "answer": "Tidak. Undangan digital Aurovia berbasis web ringan yang dapat dibuka dengan cepat di browser seluler maupun desktop."
      }
    ]
  }'::jsonb;

-- Update existing record with initial values if null
UPDATE public.system_settings
SET
  brand_color = COALESCE(brand_color, '#006A71'),
  contact_email = COALESCE(contact_email, 'support@aurovia.id'),
  social_links = COALESCE(social_links, '{"instagram": "https://instagram.com/aurovia.id", "whatsapp": "https://wa.me/6281234567890", "tiktok": "https://tiktok.com/@aurovia.id"}'::jsonb),
  landing_content = COALESCE(landing_content, '{
    "hero_headline": "Abadikan Momen Sakral dalam Lembaran Digital Abadi",
    "hero_subheadline": "Desain kurasi eksklusif, RSVP terkonfirmasi, dan tata visual anggun untuk pernikahan impian Anda.",
    "hero_cta_text": "Mulai Buat Undangan",
    "hero_cta_link": "/register",
    "secondary_cta_text": "Lihat Katalog Template",
    "secondary_cta_link": "/#template",
    "hero_image_url": "",
    "section_visibility": {
      "hero": true,
      "features": true,
      "template_showcase": true,
      "invitation_preview": true,
      "process": true,
      "faq": true,
      "cta_banner": true
    }
  }'::jsonb)
WHERE id = 'current';

-- 2. UPDATED RPC: get_system_settings
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings FROM public.system_settings WHERE id = 'current' LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'site_name', 'Aurovia',
      'logo_url', NULL,
      'favicon_url', NULL,
      'brand_color', '#006A71',
      'contact_email', 'support@aurovia.id',
      'social_links', '{"instagram": "https://instagram.com/aurovia.id", "whatsapp": "https://wa.me/6281234567890", "tiktok": "https://tiktok.com/@aurovia.id"}'::jsonb,
      'landing_content', '{}'::jsonb,
      'default_seo_title', 'Aurovia - Undangan Pernikahan Digital Elegan',
      'default_seo_description', 'Platform undangan digital pernikahan eksklusif dengan desain kurasi modern, RSVP interaktif, dan sentuhan visual premium.',
      'maintenance_mode', false,
      'registration_enabled', true,
      'catalog_enabled', true,
      'analytics_enabled', true
    );
  END IF;

  RETURN jsonb_build_object(
    'site_name', v_settings.site_name,
    'logo_url', v_settings.logo_url,
    'favicon_url', v_settings.favicon_url,
    'brand_color', COALESCE(v_settings.brand_color, '#006A71'),
    'contact_email', COALESCE(v_settings.contact_email, 'support@aurovia.id'),
    'social_links', COALESCE(v_settings.social_links, '{"instagram": "https://instagram.com/aurovia.id", "whatsapp": "https://wa.me/6281234567890", "tiktok": "https://tiktok.com/@aurovia.id"}'::jsonb),
    'landing_content', COALESCE(v_settings.landing_content, '{}'::jsonb),
    'default_seo_title', v_settings.default_seo_title,
    'default_seo_description', v_settings.default_seo_description,
    'maintenance_mode', v_settings.maintenance_mode,
    'registration_enabled', v_settings.registration_enabled,
    'catalog_enabled', v_settings.catalog_enabled,
    'analytics_enabled', v_settings.analytics_enabled,
    'updated_at', v_settings.updated_at
  );
END;
$$;

-- 3. UPDATED RPC: admin_update_system_settings
CREATE OR REPLACE FUNCTION public.admin_update_system_settings(
  p_token TEXT,
  p_settings JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL OR v_caller.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak memperbarui pengaturan sistem.';
  END IF;

  UPDATE public.system_settings
  SET
    site_name = COALESCE(p_settings->>'site_name', site_name),
    logo_url = p_settings->>'logo_url',
    favicon_url = p_settings->>'favicon_url',
    brand_color = COALESCE(p_settings->>'brand_color', brand_color),
    contact_email = COALESCE(p_settings->>'contact_email', contact_email),
    social_links = CASE 
      WHEN p_settings ? 'social_links' THEN (p_settings->'social_links')
      ELSE social_links
    END,
    landing_content = CASE 
      WHEN p_settings ? 'landing_content' THEN (p_settings->'landing_content')
      ELSE landing_content
    END,
    default_seo_title = COALESCE(p_settings->>'default_seo_title', default_seo_title),
    default_seo_description = COALESCE(p_settings->>'default_seo_description', default_seo_description),
    maintenance_mode = COALESCE((p_settings->>'maintenance_mode')::boolean, maintenance_mode),
    registration_enabled = COALESCE((p_settings->>'registration_enabled')::boolean, registration_enabled),
    catalog_enabled = COALESCE((p_settings->>'catalog_enabled')::boolean, catalog_enabled),
    analytics_enabled = COALESCE((p_settings->>'analytics_enabled')::boolean, analytics_enabled),
    updated_at = now(),
    updated_by = v_caller.username
  WHERE id = 'current';

  -- Log aktivitas perubahan pengaturan
  PERFORM public.log_admin_action(
    v_caller.id,
    v_caller.username,
    'settings_updated',
    'system_settings',
    'current',
    jsonb_build_object('timestamp', now())
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_system_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_system_settings(TEXT, JSONB) TO anon, authenticated;
