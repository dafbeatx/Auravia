-- ============================================================================
-- Migration: 20260925000000_public_guest_slug_access.sql
-- Description: Allow public anonymous lookup of guest by slug on published invitations
-- Security: Excludes phone number and private contact info from anonymous role
-- ============================================================================

-- 1. Grant selective column access to anonymous role (excluding phone)
GRANT SELECT (id, invitation_id, name, pax_limit, slug) ON public.guests TO anon;

-- 2. RLS policy: Public can only view guest record on published invitations
DROP POLICY IF EXISTS "Public can view guests on published invitations" ON public.guests;
CREATE POLICY "Public can view guests on published invitations"
  ON public.guests FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id = guests.invitation_id
        AND status = 'published'
    )
  );
