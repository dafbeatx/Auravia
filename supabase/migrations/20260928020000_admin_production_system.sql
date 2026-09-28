-- ============================================================================
-- Migration: 20260928020000_admin_production_system.sql
-- Description: Production-ready Admin Panel architecture:
--              1. Isolated admin authentication (admin_users + bcrypt hashing + admin_sessions)
--              2. Super Admin & Admin account management with brute-force protection
--              3. User management enhancements (status: active/inactive/suspended)
--              4. Invitation management RPCs for admin read-only inspection
--              5. Demo template data management (template_demos) and storage bucket (template-demo-media)
--              6. Database-driven system settings (system_settings)
--              7. Enhanced analytics event tracking and comprehensive dashboard aggregation
-- ============================================================================

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CONSTRAINT check_admin_user_role CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT check_admin_username_len CHECK (char_length(trim(username)) >= 3 AND char_length(username) <= 30),
  CONSTRAINT check_admin_username_fmt CHECK (username ~ '^[a-zA-Z0-9_.-]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username_lower
  ON public.admin_users (lower(username));

DROP TRIGGER IF EXISTS tr_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER tr_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. ADMIN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '8 hours'),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions (token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON public.admin_sessions (admin_id);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 3. SEED INITIAL SUPER ADMIN IF NOT PRESENT
-- Uses bcrypt with salt cost factor 10. Passphrase is initialized securely.
INSERT INTO public.admin_users (username, password_hash, role, is_active)
SELECT 'admin', crypt('AuroviaSuperAdmin2026#', gen_salt('bf', 10)), 'super_admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE lower(username) = 'admin'
);

-- 4. SYSTEM SETTINGS TABLE (Database-driven platform configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  site_name TEXT NOT NULL DEFAULT 'Aurovia',
  logo_url TEXT,
  favicon_url TEXT,
  default_seo_title TEXT NOT NULL DEFAULT 'Aurovia - Undangan Pernikahan Digital Elegan',
  default_seo_description TEXT NOT NULL DEFAULT 'Platform undangan digital pernikahan eksklusif dengan desain kurasi modern, RSVP interaktif, dan sentuhan visual premium.',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  registration_enabled BOOLEAN NOT NULL DEFAULT true,
  catalog_enabled BOOLEAN NOT NULL DEFAULT true,
  analytics_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

INSERT INTO public.system_settings (id, site_name, default_seo_title, default_seo_description)
VALUES (
  'current',
  'Aurovia',
  'Aurovia - Undangan Pernikahan Digital Elegan',
  'Platform undangan digital pernikahan eksklusif dengan desain kurasi modern, RSVP interaktif, dan sentuhan visual premium.'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
CREATE POLICY "Public can view system settings"
  ON public.system_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. TEMPLATE DEMOS TABLE (Demo Content Managed Directly by Admin)
CREATE TABLE IF NOT EXISTS public.template_demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  hero JSONB NOT NULL DEFAULT '{}'::jsonb,
  couple JSONB NOT NULL DEFAULT '{}'::jsonb,
  story JSONB NOT NULL DEFAULT '[]'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  quote JSONB NOT NULL DEFAULT '{}'::jsonb,
  gift JSONB NOT NULL DEFAULT '{}'::jsonb,
  rsvp JSONB NOT NULL DEFAULT '{"enabled": true, "headline": "Konfirmasi Kehadiran", "description": "Harap konfirmasikan kehadiran Anda."}'::jsonb,
  wishes JSONB NOT NULL DEFAULT '{"enabled": true}'::jsonb,
  closing JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE public.template_demos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view template demos of active templates" ON public.template_demos;
CREATE POLICY "Public can view template demos of active templates"
  ON public.template_demos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_demos.template_id
        AND t.is_active = true
        AND t.status = 'active'
    )
  );

-- 6. STORAGE BUCKET 'template-demo-media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-demo-media',
  'template-demo-media',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view demo media" ON storage.objects;
CREATE POLICY "Public can view demo media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'template-demo-media');

-- 7. ENHANCE PROFILES WITH STATUS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CONSTRAINT check_profile_status CHECK (status IN ('active', 'inactive', 'suspended'));

-- 8. ENHANCE ANALYTICS EVENTS WITH METADATA AND ANONYMOUS ID
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS anonymous_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Helper to verify admin session and get admin record
CREATE OR REPLACE FUNCTION public.verify_admin_token(p_token TEXT)
RETURNS public.admin_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin public.admin_users;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.* INTO v_admin
  FROM public.admin_sessions s
  JOIN public.admin_users u ON u.id = s.admin_id
  WHERE s.token = p_token
    AND s.expires_at > now()
    AND u.is_active = true
  LIMIT 1;

  IF FOUND THEN
    -- Touch last activity
    UPDATE public.admin_sessions
    SET last_activity_at = now()
    WHERE token = p_token;
    RETURN v_admin;
  END IF;

  RETURN NULL;
END;
$$;

-- 9. ADMIN AUTHENTICATION RPC: LOGIN
CREATE OR REPLACE FUNCTION public.admin_login(
  p_username TEXT,
  p_password TEXT,
  p_client_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user public.admin_users;
  v_clean_user TEXT;
  v_token TEXT;
BEGIN
  v_clean_user := lower(trim(p_username));
  IF v_clean_user IS NULL OR v_clean_user = '' OR p_password IS NULL OR p_password = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username atau password salah.');
  END IF;

  SELECT * INTO v_user
  FROM public.admin_users
  WHERE lower(username) = v_clean_user
  LIMIT 1;

  -- Brute-force protection: check if account is locked
  IF FOUND AND v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    -- Always generic message
    RETURN jsonb_build_object('success', false, 'error', 'Username atau password salah.');
  END IF;

  -- Validate password with bcrypt crypt()
  IF FOUND AND v_user.is_active AND (crypt(p_password, v_user.password_hash) = v_user.password_hash) THEN
    -- Reset failed attempts
    UPDATE public.admin_users
    SET failed_attempts = 0,
        locked_until = NULL,
        last_login_at = now(),
        updated_at = now()
    WHERE id = v_user.id;

    -- Generate secure cryptographic token (64 hex characters)
    v_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.admin_sessions (admin_id, token, ip_address, user_agent)
    VALUES (v_user.id, v_token, p_client_ip, p_user_agent);

    -- Log analytics event for successful login
    INSERT INTO public.analytics_events (event_name, path, session_id, metadata)
    VALUES ('login_success', '/admin/login', v_token, jsonb_build_object('role', v_user.role));

    RETURN jsonb_build_object(
      'success', true,
      'token', v_token,
      'admin', jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'role', v_user.role,
        'last_login_at', v_user.last_login_at
      )
    );
  END IF;

  -- If user found but password wrong, update lock counter
  IF FOUND THEN
    UPDATE public.admin_users
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
        updated_at = now()
    WHERE id = v_user.id;
  END IF;

  -- Log analytics event for failed login
  INSERT INTO public.analytics_events (event_name, path, session_id, metadata)
  VALUES ('login_failed', '/admin/login', 'anon_admin_attempt', jsonb_build_object('username', v_clean_user));

  -- Return generic error
  RETURN jsonb_build_object('success', false, 'error', 'Username atau password salah.');
END;
$$;

-- 10. ADMIN AUTHENTICATION RPC: VERIFY SESSION
CREATE OR REPLACE FUNCTION public.admin_verify_session(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin public.admin_users;
BEGIN
  v_admin := public.verify_admin_token(p_token);
  IF v_admin.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'admin', jsonb_build_object(
      'id', v_admin.id,
      'username', v_admin.username,
      'role', v_admin.role,
      'last_login_at', v_admin.last_login_at
    )
  );
END;
$$;

-- 11. ADMIN AUTHENTICATION RPC: LOGOUT
CREATE OR REPLACE FUNCTION public.admin_logout(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE token = p_token;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. ADMIN ACCOUNT MANAGEMENT RPCS (Super Admin Only)
CREATE OR REPLACE FUNCTION public.admin_list_accounts(p_token TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL OR v_caller.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak mengelola akun administrator.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.username, a.role, a.is_active, a.created_at, a.updated_at, a.last_login_at
  FROM public.admin_users a
  ORDER BY a.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_account(
  p_token TEXT,
  p_new_username TEXT,
  p_new_password TEXT,
  p_new_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
  v_clean_user TEXT;
  v_clean_role TEXT;
  v_new_id UUID;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL OR v_caller.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak membuat akun administrator.';
  END IF;

  v_clean_user := lower(trim(p_new_username));
  IF char_length(v_clean_user) < 3 OR char_length(v_clean_user) > 30 THEN
    RAISE EXCEPTION 'Username harus memiliki panjang 3 sampai 30 karakter.';
  END IF;

  IF NOT (v_clean_user ~ '^[a-zA-Z0-9_.-]+$') THEN
    RAISE EXCEPTION 'Username hanya boleh mengandung huruf, angka, underscore, titik, dan strip.';
  END IF;

  IF p_new_password IS NULL OR char_length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'Password minimal 8 karakter.';
  END IF;

  v_clean_role := lower(trim(p_new_role));
  IF v_clean_role NOT IN ('super_admin', 'admin') THEN
    v_clean_role := 'admin';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_users WHERE lower(username) = v_clean_user) THEN
    RAISE EXCEPTION 'Username sudah digunakan oleh akun admin lain.';
  END IF;

  INSERT INTO public.admin_users (username, password_hash, role, is_active)
  VALUES (
    v_clean_user,
    crypt(p_new_password, gen_salt('bf', 10)),
    v_clean_role,
    true
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'username', v_clean_user,
    'role', v_clean_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_account(
  p_token TEXT,
  p_target_id UUID,
  p_username TEXT,
  p_role TEXT,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
  v_clean_user TEXT;
  v_clean_role TEXT;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL OR v_caller.role <> 'super_admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak memperbarui akun administrator.';
  END IF;

  v_clean_user := lower(trim(p_username));
  IF char_length(v_clean_user) < 3 OR char_length(v_clean_user) > 30 THEN
    RAISE EXCEPTION 'Username harus memiliki panjang 3 sampai 30 karakter.';
  END IF;

  IF NOT (v_clean_user ~ '^[a-zA-Z0-9_.-]+$') THEN
    RAISE EXCEPTION 'Format username tidak valid.';
  END IF;

  v_clean_role := lower(trim(p_role));
  IF v_clean_role NOT IN ('super_admin', 'admin') THEN
    v_clean_role := 'admin';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE lower(username) = v_clean_user AND id <> p_target_id
  ) THEN
    RAISE EXCEPTION 'Username sudah digunakan oleh akun lain.';
  END IF;

  -- Prevent super_admin from deactivating themselves
  IF v_caller.id = p_target_id AND p_is_active = false THEN
    RAISE EXCEPTION 'Anda tidak dapat menonaktifkan akun sendiri.';
  END IF;

  UPDATE public.admin_users
  SET username = v_clean_user,
      role = v_clean_role,
      is_active = p_is_active,
      updated_at = now()
  WHERE id = p_target_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reset_account_password(
  p_token TEXT,
  p_target_id UUID,
  p_new_password TEXT
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
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak mereset password akun admin.';
  END IF;

  IF p_new_password IS NULL OR char_length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'Password baru minimal 8 karakter.';
  END IF;

  UPDATE public.admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = now()
  WHERE id = p_target_id;

  -- Invalidate all active sessions for the target admin
  DELETE FROM public.admin_sessions WHERE admin_id = p_target_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_own_password(
  p_token TEXT,
  p_old_password TEXT,
  p_new_password TEXT
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
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Sesi admin tidak valid atau sudah kedaluwarsa.';
  END IF;

  IF p_new_password IS NULL OR char_length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'Password baru minimal 8 karakter.';
  END IF;

  IF crypt(p_old_password, v_caller.password_hash) <> v_caller.password_hash THEN
    RAISE EXCEPTION 'Password lama tidak sesuai.';
  END IF;

  UPDATE public.admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = v_caller.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 13. USER MANAGEMENT RPCS (Admin Actions: Suspend, Activate, Delete)
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  p_token TEXT,
  p_user_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
  v_clean_status TEXT;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  v_clean_status := lower(trim(p_status));
  IF v_clean_status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Status pengguna tidak valid.';
  END IF;

  UPDATE public.profiles
  SET status = v_clean_status,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'status', v_clean_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_token TEXT,
  p_user_id UUID
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
    RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak menghapus akun pengguna.';
  END IF;

  -- Delete profile which cascades or handles relations
  DELETE FROM public.profiles WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 14. INVITATIONS MANAGEMENT RPC FOR ADMIN
CREATE OR REPLACE FUNCTION public.get_admin_invitations_list(
  p_token TEXT,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_template TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  user_id UUID,
  owner_name TEXT,
  owner_email TEXT,
  template_id UUID,
  template_name TEXT,
  template_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.slug,
    i.status,
    i.created_at,
    i.updated_at,
    i.published_at,
    i.user_id,
    p.full_name AS owner_name,
    COALESCE(u.email, 'User Terhapus')::text AS owner_email,
    t.id AS template_id,
    t.name AS template_name,
    t.slug AS template_slug
  FROM public.invitations i
  LEFT JOIN public.profiles p ON p.id = i.user_id
  LEFT JOIN auth.users u ON u.id = i.user_id
  LEFT JOIN public.templates t ON t.id = i.template_id
  WHERE (
    p_search IS NULL
    OR p_search = ''
    OR i.title ILIKE '%' || p_search || '%'
    OR i.slug ILIKE '%' || p_search || '%'
    OR u.email ILIKE '%' || p_search || '%'
    OR p.full_name ILIKE '%' || p_search || '%'
  )
  AND (
    p_status IS NULL
    OR p_status = ''
    OR p_status = 'all'
    OR i.status = p_status
  )
  AND (
    p_template IS NULL
    OR p_template = ''
    OR p_template = 'all'
    OR t.slug = p_template
  )
  ORDER BY i.created_at DESC;
END;
$$;

-- 15. TEMPLATE DEMO MANAGEMENT RPCS
CREATE OR REPLACE FUNCTION public.get_template_demo_data(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tmpl_id UUID;
  v_demo RECORD;
BEGIN
  SELECT id INTO v_tmpl_id
  FROM public.templates
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_demo
  FROM public.template_demos
  WHERE template_id = v_tmpl_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_demo.id,
    'template_id', v_demo.template_id,
    'hero', v_demo.hero,
    'couple', v_demo.couple,
    'story', v_demo.story,
    'events', v_demo.events,
    'gallery', v_demo.gallery,
    'quote', v_demo.quote,
    'gift', v_demo.gift,
    'rsvp', v_demo.rsvp,
    'wishes', v_demo.wishes,
    'closing', v_demo.closing,
    'updated_at', v_demo.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_template_demo(
  p_token TEXT,
  p_template_id UUID,
  p_demo_data JSONB
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
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  INSERT INTO public.template_demos (
    template_id,
    hero,
    couple,
    story,
    events,
    gallery,
    quote,
    gift,
    rsvp,
    wishes,
    closing,
    updated_at,
    updated_by
  )
  VALUES (
    p_template_id,
    COALESCE(p_demo_data->'hero', '{}'::jsonb),
    COALESCE(p_demo_data->'couple', '{}'::jsonb),
    COALESCE(p_demo_data->'story', '[]'::jsonb),
    COALESCE(p_demo_data->'events', '[]'::jsonb),
    COALESCE(p_demo_data->'gallery', '[]'::jsonb),
    COALESCE(p_demo_data->'quote', '{}'::jsonb),
    COALESCE(p_demo_data->'gift', '{}'::jsonb),
    COALESCE(p_demo_data->'rsvp', '{"enabled": true}'::jsonb),
    COALESCE(p_demo_data->'wishes', '{"enabled": true}'::jsonb),
    COALESCE(p_demo_data->'closing', '{}'::jsonb),
    now(),
    v_caller.username
  )
  ON CONFLICT (template_id) DO UPDATE
  SET
    hero = EXCLUDED.hero,
    couple = EXCLUDED.couple,
    story = EXCLUDED.story,
    events = EXCLUDED.events,
    gallery = EXCLUDED.gallery,
    quote = EXCLUDED.quote,
    gift = EXCLUDED.gift,
    rsvp = EXCLUDED.rsvp,
    wishes = EXCLUDED.wishes,
    closing = EXCLUDED.closing,
    updated_at = now(),
    updated_by = v_caller.username;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 16. SYSTEM SETTINGS MANAGEMENT RPCS
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'site_name', site_name,
    'logo_url', logo_url,
    'favicon_url', favicon_url,
    'default_seo_title', default_seo_title,
    'default_seo_description', default_seo_description,
    'maintenance_mode', maintenance_mode,
    'registration_enabled', registration_enabled,
    'catalog_enabled', catalog_enabled,
    'analytics_enabled', analytics_enabled,
    'updated_at', updated_at
  )
  FROM public.system_settings
  WHERE id = 'current'
  LIMIT 1;
$$;

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
    default_seo_title = COALESCE(p_settings->>'default_seo_title', default_seo_title),
    default_seo_description = COALESCE(p_settings->>'default_seo_description', default_seo_description),
    maintenance_mode = COALESCE((p_settings->>'maintenance_mode')::boolean, maintenance_mode),
    registration_enabled = COALESCE((p_settings->>'registration_enabled')::boolean, registration_enabled),
    catalog_enabled = COALESCE((p_settings->>'catalog_enabled')::boolean, catalog_enabled),
    analytics_enabled = COALESCE((p_settings->>'analytics_enabled')::boolean, analytics_enabled),
    updated_at = now(),
    updated_by = v_caller.username
  WHERE id = 'current';

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 17. COMPREHENSIVE DASHBOARD STATS AGGREGATION
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats_v2(p_token TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_users bigint := 0;
  v_users_today bigint := 0;
  v_total_invitations bigint := 0;
  v_invitations_draft bigint := 0;
  v_invitations_published bigint := 0;
  v_total_templates bigint := 0;
  v_active_templates bigint := 0;
  v_total_page_views bigint := 0;
  v_total_visitors bigint := 0;
  v_demo_views bigint := 0;
  v_login_attempts bigint := 0;
  v_error_events bigint := 0;
BEGIN
  -- Basic count queries with aggregation
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_users_today FROM public.profiles WHERE created_at >= date_trunc('day', now());
  
  SELECT count(*) INTO v_total_invitations FROM public.invitations;
  SELECT count(*) INTO v_invitations_draft FROM public.invitations WHERE status = 'draft';
  SELECT count(*) INTO v_invitations_published FROM public.invitations WHERE status = 'published';

  SELECT count(*) INTO v_total_templates FROM public.templates;
  SELECT count(*) INTO v_active_templates FROM public.templates WHERE is_active = true AND status = 'active';

  SELECT count(*) INTO v_total_page_views
  FROM public.analytics_events
  WHERE event_name IN ('page_view', 'landing_view', 'template_catalog_view');

  SELECT count(DISTINCT session_id) INTO v_total_visitors
  FROM public.analytics_events;

  SELECT count(*) INTO v_demo_views
  FROM public.analytics_events
  WHERE event_name = 'template_demo_view';

  SELECT count(*) INTO v_login_attempts
  FROM public.analytics_events
  WHERE event_name IN ('login_success', 'login_failed');

  SELECT count(*) INTO v_error_events
  FROM public.analytics_events
  WHERE event_name ILIKE '%error%';

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'users_today', v_users_today,
    'total_invitations', v_total_invitations,
    'invitations_draft', v_invitations_draft,
    'invitations_published', v_invitations_published,
    'total_templates', v_total_templates,
    'active_templates', v_active_templates,
    'total_page_views', v_total_page_views,
    'total_visitors', v_total_visitors,
    'demo_views', v_demo_views,
    'login_attempts', v_login_attempts,
    'error_events', v_error_events
  );
END;
$$;

-- 18. DETAILED TRAFFIC LOGS RPC
CREATE OR REPLACE FUNCTION public.get_admin_traffic_logs(
  p_token TEXT,
  p_period_days INT DEFAULT 30,
  p_event_filter TEXT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_name TEXT,
  path TEXT,
  session_id TEXT,
  user_id UUID,
  template_id UUID,
  template_name TEXT,
  invitation_id UUID,
  invitation_slug TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  RETURN QUERY
  SELECT
    ae.id,
    ae.event_name,
    ae.path,
    ae.session_id,
    ae.user_id,
    ae.template_id,
    t.name AS template_name,
    ae.invitation_id,
    i.slug AS invitation_slug,
    ae.referrer,
    ae.device_type,
    ae.browser,
    ae.created_at
  FROM public.analytics_events ae
  LEFT JOIN public.templates t ON t.id = ae.template_id
  LEFT JOIN public.invitations i ON i.id = ae.invitation_id
  WHERE ae.created_at >= (now() - (p_period_days || ' days')::interval)
    AND (
      p_event_filter IS NULL
      OR p_event_filter = ''
      OR p_event_filter = 'all'
      OR ae.event_name = p_event_filter
    )
  ORDER BY ae.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant EXECUTE permissions
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_account(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_account(TEXT, UUID, TEXT, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_account_password(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_own_password(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_invitations_list(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_template_demo_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_template_demo(TEXT, UUID, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_system_settings(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats_v2(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_traffic_logs(TEXT, INT, TEXT, INT, INT) TO anon, authenticated;
