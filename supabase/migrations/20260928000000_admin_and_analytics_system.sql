-- ============================================================================
-- Migration: 20260928000000_admin_and_analytics_system.sql
-- Description: Admin role authorization, template management enhancements,
--              internal analytics tracking, template-assets storage bucket, and
--              high-performance aggregation RPCs.
-- ============================================================================

-- 1. ENHANCE PROFILES WITH ROLE & AUTHORIZATION
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CONSTRAINT check_profile_role CHECK (role IN ('user', 'admin'));

-- Helper Function: Check whether current user is an admin (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Protect role modification from privilege escalation by regular users
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Cegah eskalasi hak akses oleh user biasa via client API
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengubah role pengguna.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- Grant initial administrator role to the workspace owner
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'dafbeatx@gmail.com'
);

-- Admin RLS Policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. ENHANCE TEMPLATES TABLE
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CONSTRAINT check_template_status CHECK (status IN ('draft', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS preview_thumbnail_path TEXT,
  ADD COLUMN IF NOT EXISTS preview_mobile_path TEXT,
  ADD COLUMN IF NOT EXISTS preview_desktop_path TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS tr_templates_updated_at ON public.templates;
CREATE TRIGGER tr_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Update Template RLS policies
DROP POLICY IF EXISTS "Public can view active templates" ON public.templates;
CREATE POLICY "Public can view active templates"
  ON public.templates FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND status = 'active');

DROP POLICY IF EXISTS "Admins can manage all templates" ON public.templates;
CREATE POLICY "Admins can manage all templates"
  ON public.templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
  referrer TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop' CONSTRAINT check_analytics_device CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'unknown')),
  browser TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_event_name_length CHECK (char_length(event_name) > 0 AND char_length(event_name) <= 60),
  CONSTRAINT check_session_id_length CHECK (char_length(session_id) > 0 AND char_length(session_id) <= 100),
  CONSTRAINT check_path_length CHECK (char_length(path) > 0 AND char_length(path) <= 255)
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_name_created ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_template ON public.analytics_events (template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view analytics events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. STORAGE BUCKET 'template-assets'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-assets',
  'template-assets',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for template-assets
DROP POLICY IF EXISTS "Public can view template assets" ON storage.objects;
CREATE POLICY "Public can view template assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'template-assets');

DROP POLICY IF EXISTS "Admins can upload template assets" ON storage.objects;
CREATE POLICY "Admins can upload template assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'template-assets'
    AND public.is_admin()
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );

DROP POLICY IF EXISTS "Admins can update template assets" ON storage.objects;
CREATE POLICY "Admins can update template assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'template-assets'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'template-assets'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete template assets" ON storage.objects;
CREATE POLICY "Admins can delete template assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'template-assets'
    AND public.is_admin()
  );

-- 5. AGGREGATE RPC FUNCTIONS (Bandwidth & Egress Optimized)

-- Dashboard overview statistics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  res jsonb;
  v_total_users bigint;
  v_total_invitations bigint;
  v_total_templates bigint;
  v_active_templates bigint;
  v_draft_templates bigint;
  v_total_demo_views bigint;
  v_total_visitors bigint;
  v_total_invitation_views bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengakses statistik ini.';
  END IF;

  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_invitations FROM public.invitations;
  SELECT count(*) INTO v_total_templates FROM public.templates;
  SELECT count(*) INTO v_active_templates FROM public.templates WHERE is_active = true AND status = 'active';
  SELECT count(*) INTO v_draft_templates FROM public.templates WHERE status = 'draft';
  
  SELECT count(*) INTO v_total_demo_views FROM public.analytics_events WHERE event_name = 'template_demo_view';
  SELECT count(DISTINCT session_id) INTO v_total_visitors FROM public.analytics_events;
  SELECT count(*) INTO v_total_invitation_views FROM public.analytics_events WHERE event_name = 'public_invitation_view';

  res := jsonb_build_object(
    'total_users', v_total_users,
    'total_invitations', v_total_invitations,
    'total_templates', v_total_templates,
    'active_templates', v_active_templates,
    'draft_templates', v_draft_templates,
    'total_demo_views', v_total_demo_views,
    'total_visitors', v_total_visitors,
    'total_invitation_views', v_total_invitation_views
  );

  RETURN res;
END;
$$;

-- Traffic breakdown over days
CREATE OR REPLACE FUNCTION public.get_admin_traffic_stats(period_days integer DEFAULT 30)
RETURNS TABLE (
  day_date text,
  visitors bigint,
  page_views bigint,
  demo_views bigint,
  login_success bigint,
  register_success bigint,
  invitation_create bigint,
  invitation_publish bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengakses data traffic.';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT to_char(d, 'YYYY-MM-DD') AS d_str, d::date AS d_date
    FROM generate_series(
      CURRENT_DATE - (period_days - 1) * INTERVAL '1 day',
      CURRENT_DATE,
      INTERVAL '1 day'
    ) AS d
  ),
  agg AS (
    SELECT 
      to_char(created_at, 'YYYY-MM-DD') AS event_day,
      count(DISTINCT session_id) AS visitors_cnt,
      count(*) FILTER (WHERE event_name IN ('page_view', 'landing_view', 'template_catalog_view')) AS page_views_cnt,
      count(*) FILTER (WHERE event_name = 'template_demo_view') AS demo_views_cnt,
      count(*) FILTER (WHERE event_name = 'login_success') AS login_success_cnt,
      count(*) FILTER (WHERE event_name = 'register_success') AS register_success_cnt,
      count(*) FILTER (WHERE event_name = 'invitation_create') AS invitation_create_cnt,
      count(*) FILTER (WHERE event_name = 'invitation_publish') AS invitation_publish_cnt
    FROM public.analytics_events
    WHERE created_at >= (CURRENT_DATE - (period_days - 1) * INTERVAL '1 day')
    GROUP BY to_char(created_at, 'YYYY-MM-DD')
  )
  SELECT 
    ds.d_str AS day_date,
    COALESCE(a.visitors_cnt, 0)::bigint AS visitors,
    COALESCE(a.page_views_cnt, 0)::bigint AS page_views,
    COALESCE(a.demo_views_cnt, 0)::bigint AS demo_views,
    COALESCE(a.login_success_cnt, 0)::bigint AS login_success,
    COALESCE(a.register_success_cnt, 0)::bigint AS register_success,
    COALESCE(a.invitation_create_cnt, 0)::bigint AS invitation_create,
    COALESCE(a.invitation_publish_cnt, 0)::bigint AS invitation_publish
  FROM date_series ds
  LEFT JOIN agg a ON ds.d_str = a.event_day
  ORDER BY ds.d_date ASC;
END;
$$;

-- Template performance metrics
CREATE OR REPLACE FUNCTION public.get_admin_template_performance()
RETURNS TABLE (
  template_id uuid,
  name text,
  slug text,
  category text,
  status text,
  demo_views bigint,
  unique_visitors bigint,
  published_usage bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengakses performa template.';
  END IF;

  RETURN QUERY
  SELECT 
    t.id AS template_id,
    t.name,
    t.slug,
    t.category,
    t.status,
    COALESCE(ev.demo_views, 0)::bigint AS demo_views,
    COALESCE(ev.unique_visitors, 0)::bigint AS unique_visitors,
    COALESCE(inv.usage_count, 0)::bigint AS published_usage
  FROM public.templates t
  LEFT JOIN (
    SELECT 
      ae.template_id,
      count(*) AS demo_views,
      count(DISTINCT ae.session_id) AS unique_visitors
    FROM public.analytics_events ae
    WHERE ae.event_name = 'template_demo_view' AND ae.template_id IS NOT NULL
    GROUP BY ae.template_id
  ) ev ON t.id = ev.template_id
  LEFT JOIN (
    SELECT 
      i.template_id,
      count(*) AS usage_count
    FROM public.invitations i
    WHERE i.status = 'published'
    GROUP BY i.template_id
  ) inv ON t.id = inv.template_id
  ORDER BY t.name ASC;
END;
$$;

-- User management list without leaking sensitive auth tokens/passwords
CREATE OR REPLACE FUNCTION public.get_admin_users_list(search_term text DEFAULT NULL, role_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  invitation_count bigint,
  published_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang dapat mengakses daftar pengguna.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.role,
    p.created_at,
    u.last_sign_in_at,
    COALESCE(inv.total_invitations, 0)::bigint AS invitation_count,
    COALESCE(inv.published_invitations, 0)::bigint AS published_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  LEFT JOIN (
    SELECT 
      i.user_id,
      count(*) AS total_invitations,
      count(*) FILTER (WHERE i.status = 'published') AS published_invitations
    FROM public.invitations i
    GROUP BY i.user_id
  ) inv ON p.id = inv.user_id
  WHERE (
    search_term IS NULL 
    OR search_term = '' 
    OR u.email ILIKE '%' || search_term || '%' 
    OR p.full_name ILIKE '%' || search_term || '%'
  )
  AND (
    role_filter IS NULL 
    OR role_filter = '' 
    OR role_filter = 'all'
    OR p.role = role_filter
  )
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_traffic_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_template_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_list(text, text) TO authenticated;
