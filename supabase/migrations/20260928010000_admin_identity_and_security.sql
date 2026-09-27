-- ============================================================================
-- Migration: 20260928010000_admin_identity_and_security.sql
-- Description: Dedicated admin identity table, username management, and
--              secure credential resolution for /admin/login and /admin/settings/security.
-- ============================================================================

-- 1. ADMIN IDENTITIES TABLE
-- Maps auth.users to unique, customizable usernames for admin authentication.
-- Password remains strictly managed and hashed inside Supabase Auth (auth.users).
CREATE TABLE IF NOT EXISTS public.admin_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_admin_username_length CHECK (char_length(trim(username)) >= 3 AND char_length(username) <= 30),
  CONSTRAINT check_admin_username_format CHECK (username ~ '^[a-zA-Z0-9_.-]+$')
);

-- Case-insensitive uniqueness index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_identities_username_lower
  ON public.admin_identities (lower(username));

-- 2. ROW LEVEL SECURITY (RLS) FOR ADMIN IDENTITIES
ALTER TABLE public.admin_identities ENABLE ROW LEVEL SECURITY;

-- Deny all for regular users and anonymous visitors by default
DROP POLICY IF EXISTS "Admins can view admin identities" ON public.admin_identities;
CREATE POLICY "Admins can view admin identities"
  ON public.admin_identities FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update own admin identity" ON public.admin_identities;
CREATE POLICY "Admins can update own admin identity"
  ON public.admin_identities FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND auth_user_id = auth.uid())
  WITH CHECK (public.is_admin() AND auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert admin identities" ON public.admin_identities;
CREATE POLICY "Admins can insert admin identities"
  ON public.admin_identities FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admin identities" ON public.admin_identities;
CREATE POLICY "Admins can delete admin identities"
  ON public.admin_identities FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. SECURE RESOLVER: GET ADMIN LOGIN EMAIL
-- Maps username to the associated auth email strictly for admin users.
-- Runs with SECURITY DEFINER to allow the unauthenticated login form to initiate
-- signInWithPassword({ email, password }) without exposing admin identities to public queries.
CREATE OR REPLACE FUNCTION public.get_admin_login_email(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_username IS NULL OR trim(p_username) = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  JOIN public.admin_identities a ON a.auth_user_id = u.id
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(a.username) = lower(trim(p_username))
    AND p.role = 'admin'
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_login_email(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_login_email(TEXT) TO anon, authenticated;

-- 4. RPC: GET CURRENT ADMIN IDENTITY
-- Retrieves current authenticated administrator identity safely.
CREATE OR REPLACE FUNCTION public.get_admin_identity()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_record RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat melihat identitas admin.';
  END IF;

  SELECT a.id, a.username, a.role, a.created_at, a.updated_at, u.email
  INTO v_record
  FROM public.admin_identities a
  JOIN auth.users u ON u.id = a.auth_user_id
  WHERE a.auth_user_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    -- If entry does not exist yet for this admin, fallback gracefully
    RETURN jsonb_build_object(
      'username', NULL,
      'role', 'admin',
      'email', (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_record.id,
    'username', v_record.username,
    'role', v_record.role,
    'email', v_record.email,
    'created_at', v_record.created_at,
    'updated_at', v_record.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_identity() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_identity() TO authenticated;

-- 5. RPC: UPDATE ADMIN USERNAME
-- Allows an authenticated administrator to update their unique admin username.
CREATE OR REPLACE FUNCTION public.update_admin_username(p_new_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_cleaned TEXT;
  v_exists BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat memperbarui username admin.';
  END IF;

  v_cleaned := lower(trim(p_new_username));

  IF char_length(v_cleaned) < 3 OR char_length(v_cleaned) > 30 THEN
    RAISE EXCEPTION 'Username harus memiliki panjang antara 3 sampai 30 karakter.';
  END IF;

  IF NOT (v_cleaned ~ '^[a-zA-Z0-9_.-]+$') THEN
    RAISE EXCEPTION 'Username hanya boleh mengandung huruf, angka, underscore (_), titik (.), dan strip (-).';
  END IF;

  -- Check if taken by another admin
  SELECT EXISTS (
    SELECT 1 FROM public.admin_identities
    WHERE lower(username) = v_cleaned
      AND auth_user_id <> auth.uid()
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Username sudah digunakan oleh akun lain.';
  END IF;

  -- Upsert identity for current user
  INSERT INTO public.admin_identities (auth_user_id, username, role, updated_at)
  VALUES (auth.uid(), v_cleaned, 'admin', now())
  ON CONFLICT (auth_user_id) DO UPDATE
    SET username = v_cleaned,
        updated_at = now();

  RETURN jsonb_build_object('success', true, 'username', v_cleaned);
END;
$$;

REVOKE ALL ON FUNCTION public.update_admin_username(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.update_admin_username(TEXT) TO authenticated;

-- 6. PROVISION INITIAL ADMIN IDENTITY
-- Map existing admin users (e.g. dafbeatx@gmail.com) to the default admin username.
INSERT INTO public.admin_identities (auth_user_id, username, role)
SELECT id, 'admin', 'admin'
FROM auth.users
WHERE email = 'dafbeatx@gmail.com'
ON CONFLICT (auth_user_id) DO NOTHING;
