-- ============================================================================
-- AUROVIA DATABASE SEED: INITIAL FOUNDATIONAL TEMPLATE
-- Purpose: Insert the first real foundational master template for Aurovia
-- Idempotency: Uses ON CONFLICT (slug) DO NOTHING
-- ============================================================================

INSERT INTO public.templates (
  slug,
  name,
  category,
  description,
  thumbnail_url,
  default_theme,
  default_sections,
  is_active
)
VALUES (
  'classic-elegance',
  'Classic Elegance',
  'wedding',
  'Desain undangan pernikahan editorial dengan tipografi klasik dan estetika abadi.',
  '/templates/classic-elegance/thumbnail.webp',
  '{"font_heading": "Cormorant Garamond", "font_body": "Plus Jakarta Sans", "color_primary": "#292524", "color_background": "#FAF9F6", "color_surface": "#FFFFFF", "color_border": "#E7E5E0"}'::jsonb,
  '[{"type": "hero", "order": 0, "enabled": true}, {"type": "hosts", "order": 1, "enabled": true}, {"type": "events", "order": 2, "enabled": true}, {"type": "story", "order": 3, "enabled": true}, {"type": "gallery", "order": 4, "enabled": true}, {"type": "gift", "order": 5, "enabled": true}, {"type": "rsvp", "order": 6, "enabled": true}, {"type": "closing", "order": 7, "enabled": true}]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;
