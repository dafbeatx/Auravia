-- ==============================================================================
-- AUROVIA MIGRATION: 20260928030000_admin_activity_and_extended_management.sql
-- Description: Activity logs table, display_name column for admin_users,
--              template-assets storage bucket, template duplication RPC,
--              and extended admin profile management.
-- ==============================================================================

-- 1. ADD display_name TO admin_users
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Administrator';

-- Set initial display name for existing admin
UPDATE public.admin_users
SET display_name = 'Super Administrator'
WHERE username = 'admin' AND (display_name IS NULL OR display_name = 'Administrator');

-- 2. CREATE admin_activity_logs TABLE
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON public.admin_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON public.admin_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin ON public.admin_activity_logs (admin_id);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public cannot read admin_activity_logs directly" ON public.admin_activity_logs;
CREATE POLICY "Public cannot read admin_activity_logs directly"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated, anon
  USING (false);

-- 3. ENSURE STORAGE BUCKET 'template-assets'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-assets',
  'template-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view template-assets" ON storage.objects;
CREATE POLICY "Public can view template-assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'template-assets');

-- 4. RPC: LOG ACTIVITY HELPER
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_username TEXT,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id,
    admin_username,
    action,
    target_type,
    target_id,
    metadata,
    created_at
  )
  VALUES (
    p_admin_id,
    COALESCE(p_username, 'admin'),
    p_action,
    p_target_type,
    p_target_id,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  );
END;
$$;

-- 5. RPC: GET ACTIVITY LOGS FOR ADMIN
CREATE OR REPLACE FUNCTION public.get_admin_activity_logs(
  p_token TEXT,
  p_action_filter TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  admin_id UUID,
  admin_username TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
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
    l.id,
    l.admin_id,
    l.admin_username,
    l.action,
    l.target_type,
    l.target_id,
    l.metadata,
    l.created_at
  FROM public.admin_activity_logs l
  WHERE (
    p_action_filter IS NULL
    OR p_action_filter = ''
    OR p_action_filter = 'all'
    OR l.action = p_action_filter
  )
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 6. RPC: RECORD ADMIN ACTIVITY FROM CLIENT
CREATE OR REPLACE FUNCTION public.admin_record_activity(
  p_token TEXT,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
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

  PERFORM public.log_admin_action(
    v_caller.id,
    v_caller.username,
    p_action,
    p_target_type,
    p_target_id,
    p_metadata
  );

  RETURN true;
END;
$$;

-- 7. RPC: UPDATE ADMIN PROFILE (Username & Display Name)
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_token TEXT,
  p_new_username TEXT,
  p_display_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
  v_clean_username TEXT;
  v_clean_display TEXT;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  v_clean_username := lower(trim(p_new_username));
  v_clean_display := trim(p_display_name);

  IF v_clean_username IS NULL OR char_length(v_clean_username) < 3 OR char_length(v_clean_username) > 30 THEN
    RAISE EXCEPTION 'Username harus memiliki panjang 3 sampai 30 karakter.';
  END IF;

  IF NOT (v_clean_username ~ '^[a-zA-Z0-9_.-]+$') THEN
    RAISE EXCEPTION 'Username hanya boleh mengandung huruf, angka, underscore, titik, dan strip.';
  END IF;

  IF v_clean_display IS NULL OR char_length(v_clean_display) < 2 THEN
    v_clean_display := v_caller.display_name;
  END IF;

  -- Cek keunikan username jika berganti
  IF v_clean_username <> lower(v_caller.username) THEN
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE lower(username) = v_clean_username AND id <> v_caller.id) THEN
      RAISE EXCEPTION 'Username sudah digunakan oleh akun admin lain.';
    END IF;
  END IF;

  UPDATE public.admin_users
  SET
    username = v_clean_username,
    display_name = v_clean_display,
    updated_at = now()
  WHERE id = v_caller.id;

  -- Catat log aktivitas
  PERFORM public.log_admin_action(
    v_caller.id,
    v_clean_username,
    'admin_profile_updated',
    'admin_user',
    v_caller.id::text,
    jsonb_build_object('old_username', v_caller.username, 'new_username', v_clean_username, 'display_name', v_clean_display)
  );

  RETURN jsonb_build_object(
    'success', true,
    'username', v_clean_username,
    'display_name', v_clean_display
  );
END;
$$;

-- 8. RPC: DUPLICATE TEMPLATE
CREATE OR REPLACE FUNCTION public.admin_duplicate_template(
  p_token TEXT,
  p_template_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller public.admin_users;
  v_source public.templates;
  v_new_slug TEXT;
  v_new_name TEXT;
  v_new_id UUID;
  v_demo public.template_demos;
  v_counter INT := 1;
BEGIN
  v_caller := public.verify_admin_token(p_token);
  IF v_caller.id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  SELECT * INTO v_source
  FROM public.templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template asal tidak ditemukan.';
  END IF;

  -- Buat slug dan nama unik
  v_new_slug := v_source.slug || '-copy';
  WHILE EXISTS (SELECT 1 FROM public.templates WHERE slug = v_new_slug) LOOP
    v_counter := v_counter + 1;
    v_new_slug := v_source.slug || '-copy-' || v_counter;
  END LOOP;

  v_new_name := v_source.name || ' (Copy)';

  -- Duplikasi template record
  INSERT INTO public.templates (
    name,
    slug,
    category,
    description,
    status,
    is_active,
    is_featured,
    display_order,
    thumbnail_url,
    preview_mobile_path,
    preview_desktop_path,
    preview_thumbnail_path,
    default_theme,
    default_sections
  )
  VALUES (
    v_new_name,
    v_new_slug,
    v_source.category,
    v_source.description,
    'draft',
    false,
    false,
    v_source.display_order + 1,
    v_source.thumbnail_url,
    v_source.preview_mobile_path,
    v_source.preview_desktop_path,
    v_source.preview_thumbnail_path,
    v_source.default_theme,
    v_source.default_sections
  )
  RETURNING id INTO v_new_id;

  -- Duplikasi demo data jika ada
  SELECT * INTO v_demo
  FROM public.template_demos
  WHERE template_id = p_template_id;

  IF FOUND THEN
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
      updated_by
    )
    VALUES (
      v_new_id,
      v_demo.hero,
      v_demo.couple,
      v_demo.story,
      v_demo.events,
      v_demo.gallery,
      v_demo.quote,
      v_demo.gift,
      v_demo.rsvp,
      v_demo.wishes,
      v_demo.closing,
      v_caller.username
    );
  END IF;

  -- Catat log aktivitas
  PERFORM public.log_admin_action(
    v_caller.id,
    v_caller.username,
    'template_duplicated',
    'template',
    v_new_id::text,
    jsonb_build_object('source_id', p_template_id, 'new_slug', v_new_slug)
  );

  RETURN v_new_id;
END;
$$;

-- 9. PERBARUI RPC admin_verify_session UNTUK MENYERTAKAN display_name
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
      'display_name', COALESCE(v_admin.display_name, v_admin.username),
      'role', v_admin.role,
      'last_login_at', v_admin.last_login_at
    )
  );
END;
$$;

-- 10. UPDATE admin_login TO RECORD ACTIVITY LOG & INCLUDE display_name
CREATE OR REPLACE FUNCTION public.admin_login(
  p_username TEXT,
  p_password TEXT,
  p_client_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
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

    -- Log to admin_activity_logs
    PERFORM public.log_admin_action(
      v_user.id,
      v_user.username,
      'login',
      'admin_user',
      v_user.id::text,
      jsonb_build_object('ip', p_client_ip, 'user_agent', p_user_agent)
    );

    RETURN jsonb_build_object(
      'success', true,
      'token', v_token,
      'admin', jsonb_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'display_name', COALESCE(v_user.display_name, v_user.username),
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

  RETURN jsonb_build_object('success', false, 'error', 'Username atau password salah.');
END;
$$;

-- 11. UPDATE admin_logout TO RECORD ACTIVITY LOG
CREATE OR REPLACE FUNCTION public.admin_logout(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin public.admin_users;
BEGIN
  v_admin := public.verify_admin_token(p_token);
  IF v_admin.id IS NOT NULL THEN
    PERFORM public.log_admin_action(
      v_admin.id,
      v_admin.username,
      'logout',
      'admin_session',
      NULL,
      '{}'::jsonb
    );
  END IF;

  DELETE FROM public.admin_sessions WHERE token = p_token;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. UPDATE admin_change_own_password TO RECORD ACTIVITY LOG
CREATE OR REPLACE FUNCTION public.admin_change_own_password(
  p_token TEXT,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
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

  PERFORM public.log_admin_action(
    v_caller.id,
    v_caller.username,
    'admin_password_changed',
    'admin_user',
    v_caller.id::text,
    '{}'::jsonb
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 13. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_admin_activity_logs(TEXT, TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_activity(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_duplicate_template(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_own_password(TEXT, TEXT, TEXT) TO anon, authenticated;

