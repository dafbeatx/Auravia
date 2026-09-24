-- ============================================================================
-- Migration: 20260924000002_storage_invitation_gallery.sql
-- Description: Create invitation-gallery storage bucket and configure multi-tenant RLS policies
-- ============================================================================

-- 1. Inisialisasi Storage Bucket 'invitation-gallery'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invitation-gallery',
  'invitation-gallery',
  true,
  5242880, -- 5 MB limit per berkas
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Kebijakan Row Level Security (RLS) pada storage.objects untuk bucket 'invitation-gallery'

-- A. INSERT: Pengguna terautentikasi hanya dapat mengunggah ke folder miliknya sendiri:
--    {user_id}/{invitation_id}/* dengan syarat invitation_id dimiliki oleh pengguna tersebut.
CREATE POLICY "Users can upload gallery images to own invitation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invitation-gallery'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id::text = (storage.foldername(name))[2]
        AND user_id = (SELECT auth.uid())
    )
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );

-- B. SELECT: Pemilik dapat melihat berkasnya sendiri, dan publik/anonim hanya dapat melihat
--    berkas dari undangan yang berstatus 'published'.
CREATE POLICY "Public and owners can view gallery images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'invitation-gallery'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1 FROM public.invitations
        WHERE id::text = (storage.foldername(name))[2]
          AND status = 'published'
      )
    )
  );

-- C. UPDATE: Pengguna terautentikasi hanya dapat memperbarui berkas di folder undangannya sendiri.
CREATE POLICY "Owners can update own gallery images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'invitation-gallery'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id::text = (storage.foldername(name))[2]
        AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'invitation-gallery'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id::text = (storage.foldername(name))[2]
        AND user_id = (SELECT auth.uid())
    )
  );

-- D. DELETE: Pengguna terautentikasi hanya dapat menghapus berkas di folder undangannya sendiri.
CREATE POLICY "Owners can delete own gallery images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invitation-gallery'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.invitations
      WHERE id::text = (storage.foldername(name))[2]
        AND user_id = (SELECT auth.uid())
    )
  );
