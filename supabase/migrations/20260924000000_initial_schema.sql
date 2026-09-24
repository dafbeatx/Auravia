-- ============================================================================
-- AUROVIA DATABASE INITIAL SCHEMA & SECURITY MIGRATION
-- Source of Truth: Aurovia Database & RLS Specification v1.3
-- Security Hardening: Aurovia Database Security Audit v1.4
-- ============================================================================

-- Prerequisites
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Auto-create profile on Supabase auth user signup (Hardened)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User Aurovia')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_full_name_length CHECK (char_length(trim(full_name)) > 0 AND char_length(full_name) <= 100),
  CONSTRAINT check_phone_format CHECK (phone IS NULL OR char_length(phone) <= 20)
);

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger on auth.users for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. TEMPLATES (Katalog Toko Aurovia)
-- ============================================================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  default_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_template_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT check_template_category CHECK (category IN ('wedding', 'birthday', 'corporate', 'general'))
);

-- ============================================================================
-- 3. INVITATIONS (Kontainer Tenant Undangan)
-- ============================================================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'wedding',
  status TEXT NOT NULL DEFAULT 'draft',
  allow_rsvp BOOLEAN NOT NULL DEFAULT true,
  show_wishes BOOLEAN NOT NULL DEFAULT true,
  theme_override JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"music_url": null}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_invitation_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) >= 3 AND char_length(slug) <= 60),
  CONSTRAINT check_invitation_title_length CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 120),
  CONSTRAINT check_invitation_status CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TRIGGER tr_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. INVITATION_DATA (Konten Presentasi Fleksibel)
-- ============================================================================
CREATE TABLE public.invitation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL UNIQUE REFERENCES public.invitations(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{"hosts": [], "story": [], "financial_accounts": [], "closing_notes": ""}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tr_invitation_data_updated_at
  BEFORE UPDATE ON public.invitation_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. INVITATION_SECTIONS (Urutan & Toggle Seksi Visual)
-- ============================================================================
CREATE TABLE public.invitation_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'default',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_section_type CHECK (section_type IN ('hero', 'hosts', 'events', 'story', 'gallery', 'gift', 'rsvp', 'closing')),
  CONSTRAINT check_section_display_order CHECK (display_order >= 0)
);

-- ============================================================================
-- 6. EVENTS (Agenda Acara)
-- ============================================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  venue_name TEXT NOT NULL,
  address TEXT,
  maps_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_event_title_length CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 100),
  CONSTRAINT check_event_time_range CHECK (end_time IS NULL OR end_time >= start_time),
  CONSTRAINT check_event_maps_url CHECK (maps_url IS NULL OR maps_url ~ '^https?://')
);

-- ============================================================================
-- 7. GALLERY_ITEMS (Metadata Media Terpisah)
-- ============================================================================
CREATE TABLE public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_gallery_caption_length CHECK (caption IS NULL OR char_length(caption) <= 200),
  CONSTRAINT check_gallery_display_order CHECK (display_order >= 0),
  CONSTRAINT check_gallery_dimensions CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0))
);

-- ============================================================================
-- 8. GUESTS (Buku Tamu Personal)
-- ============================================================================
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  pax_limit INTEGER NOT NULL DEFAULT 1,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_guest_name_length CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 100),
  CONSTRAINT check_guest_pax_limit CHECK (pax_limit >= 1 AND pax_limit <= 20),
  CONSTRAINT check_guest_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  CONSTRAINT uq_guests_invitation_slug UNIQUE (invitation_id, slug),
  CONSTRAINT uq_guests_id_invitation UNIQUE (id, invitation_id)
);

-- ============================================================================
-- 9. RSVPS (Konfirmasi Kehadiran & Ucapan Tamu)
-- ============================================================================
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  guest_id UUID,
  guest_name TEXT NOT NULL,
  status TEXT NOT NULL,
  pax_count INTEGER NOT NULL DEFAULT 1,
  wishes TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_rsvp_guest_name CHECK (char_length(trim(guest_name)) > 0 AND char_length(guest_name) <= 100),
  CONSTRAINT check_rsvp_status CHECK (status IN ('attending', 'declined', 'tentative')),
  CONSTRAINT check_rsvp_pax_count CHECK (pax_count >= 1 AND pax_count <= 20),
  CONSTRAINT check_rsvp_wishes_length CHECK (wishes IS NULL OR char_length(wishes) <= 500),
  CONSTRAINT fk_rsvps_composite_guest FOREIGN KEY (guest_id, invitation_id) REFERENCES public.guests(id, invitation_id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEX STRATEGY (Non-Redundant & High-Selectivity Only)
-- ============================================================================
CREATE INDEX idx_invitations_user_id ON public.invitations (user_id);
CREATE INDEX idx_invitation_sections_invitation_order ON public.invitation_sections (invitation_id, display_order ASC);
CREATE INDEX idx_events_invitation_start ON public.events (invitation_id, start_time ASC);
CREATE INDEX idx_gallery_items_invitation_order ON public.gallery_items (invitation_id, display_order ASC);
CREATE INDEX idx_rsvps_invitation_created ON public.rsvps (invitation_id, created_at DESC);
CREATE INDEX idx_rsvps_guest_invitation ON public.rsvps (guest_id, invitation_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- --- PROFILES ---
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- --- TEMPLATES ---
CREATE POLICY "Public can view active templates"
  ON public.templates FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- --- INVITATIONS ---
CREATE POLICY "Public can view published invitations"
  ON public.invitations FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Owners can view own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Owners can insert own invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Owners can update own invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Owners can delete own invitations"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- --- INVITATION_DATA ---
CREATE POLICY "Public can view data of published invitations"
  ON public.invitation_data FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND status = 'published'
    )
  );

CREATE POLICY "Owners can view own invitation data"
  ON public.invitation_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert own invitation data"
  ON public.invitation_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update own invitation data"
  ON public.invitation_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own invitation data"
  ON public.invitation_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_data.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- --- INVITATION_SECTIONS ---
CREATE POLICY "Public can view sections of published invitations"
  ON public.invitation_sections FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND status = 'published'
    )
  );

CREATE POLICY "Owners can view own invitation sections"
  ON public.invitation_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert own invitation sections"
  ON public.invitation_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update own invitation sections"
  ON public.invitation_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own invitation sections"
  ON public.invitation_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = invitation_sections.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- --- EVENTS ---
CREATE POLICY "Public can view events of published invitations"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND status = 'published'
    )
  );

CREATE POLICY "Owners can view own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = events.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- --- GALLERY_ITEMS ---
CREATE POLICY "Public can view gallery of published invitations"
  ON public.gallery_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND status = 'published'
    )
  );

CREATE POLICY "Owners can view own gallery items"
  ON public.gallery_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert own gallery items"
  ON public.gallery_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update own gallery items"
  ON public.gallery_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own gallery items"
  ON public.gallery_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = gallery_items.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- --- GUESTS (Private: Anonymous DENY all) ---
CREATE POLICY "Owners can view own guests"
  ON public.guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can insert own guests"
  ON public.guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can update own guests"
  ON public.guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete own guests"
  ON public.guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- --- RSVPS ---
CREATE POLICY "Public can view unhidden rsvp wishes"
  ON public.rsvps FOR SELECT
  TO anon, authenticated
  USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND status = 'published'
        AND show_wishes = true
    )
  );

-- Public submit RSVP: Hardened with is_hidden = false
CREATE POLICY "Public can submit rsvp to published invitations"
  ON public.rsvps FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND status = 'published'
        AND allow_rsvp = true
    )
  );

CREATE POLICY "Owners can view all rsvps"
  ON public.rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- Owners can only update moderation state (is_hidden) via RLS & column grant
CREATE POLICY "Owners can update rsvps"
  ON public.rsvps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can delete rsvps"
  ON public.rsvps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = rsvps.invitation_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- MINIMUM PRIVILEGE (GRANT / REVOKE)
-- ============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public, anon, authenticated;

-- Role anon (Tamu Publik: Least Privilege & Column Level Protection)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.templates TO anon;
-- Exclude user_id from anonymous SELECT:
GRANT SELECT (id, template_id, slug, title, event_type, status, allow_rsvp, show_wishes, theme_override, settings, published_at, created_at) ON public.invitations TO anon;
GRANT SELECT ON public.invitation_data TO anon;
GRANT SELECT ON public.invitation_sections TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.gallery_items TO anon;
-- Exclude guest_id, pax_count, status, is_hidden from anonymous SELECT:
GRANT SELECT (id, invitation_id, guest_name, wishes, created_at) ON public.rsvps TO anon;
-- Exclude is_hidden from anonymous INSERT:
GRANT INSERT (invitation_id, guest_id, guest_name, status, pax_count, wishes) ON public.rsvps TO anon;

-- Role authenticated (Pengguna Terdaftar: Explicit DML Only, No TRUNCATE/TRIGGER/REFERENCES)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitation_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitation_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT, DELETE ON public.rsvps TO authenticated;
-- Allow authenticated users to submit RSVP as guests (excluding is_hidden):
GRANT INSERT (invitation_id, guest_id, guest_name, status, pax_count, wishes) ON public.rsvps TO authenticated;
-- Owner only permitted to update moderation column (is_hidden):
GRANT UPDATE (is_hidden) ON public.rsvps TO authenticated;
