-- ============================================================================
-- AUROVIA DATABASE SEED: BOTANICAL GARDEN & MODERN MINIMAL TEMPLATES
-- Purpose: Insert additional curated invitation templates to complete the 4-template catalog
-- Idempotency: Uses ON CONFLICT (slug) DO UPDATE
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
VALUES
(
  'botanical-garden',
  'Botanical Garden',
  'wedding',
  'Desain undangan bernuansa sage green alami dengan estetika dedaunan dan tipografi editorial segar.',
  '/templates/botanical-garden/thumbnail.webp',
  '{"font_heading": "Playfair Display", "font_body": "Plus Jakarta Sans", "color_background": "#F4F6F0", "color_foreground": "#1E3A2F", "color_primary": "#2D4F3F", "color_secondary": "#4D725C", "color_surface": "#FFFFFF", "color_border": "#D3DDD3", "color_accent": "#7A9A7B", "color_accent_soft": "#E2ECE2", "color_muted": "#526A5E", "button_radius": "pill", "card_radius": "rounded", "decorative_style": "classic"}'::jsonb,
  '[{"type": "hero", "order": 0, "enabled": true}, {"type": "hosts", "order": 1, "enabled": true}, {"type": "events", "order": 2, "enabled": true}, {"type": "story", "order": 3, "enabled": true}, {"type": "gallery", "order": 4, "enabled": true}, {"type": "gift", "order": 5, "enabled": true}, {"type": "rsvp", "order": 6, "enabled": true}, {"type": "closing", "order": 7, "enabled": true}]'::jsonb,
  true
),
(
  'modern-minimal',
  'Modern Minimal',
  'wedding',
  'Desain undangan modern dengan garis bersih, ruang terbuka luas, dan fokus pada keanggunan tipografi.',
  '/templates/modern-minimal/thumbnail.webp',
  '{"font_heading": "Outfit", "font_body": "Plus Jakarta Sans", "color_background": "#F8F9FA", "color_foreground": "#0F172A", "color_primary": "#006A71", "color_secondary": "#48A6A7", "color_surface": "#FFFFFF", "color_border": "#E2E8F0", "color_accent": "#006A71", "color_accent_soft": "#E6F4F5", "color_muted": "#64748B", "button_radius": "rounded", "card_radius": "rounded", "decorative_style": "minimal"}'::jsonb,
  '[{"type": "hero", "order": 0, "enabled": true}, {"type": "hosts", "order": 1, "enabled": true}, {"type": "events", "order": 2, "enabled": true}, {"type": "story", "order": 3, "enabled": true}, {"type": "gallery", "order": 4, "enabled": true}, {"type": "gift", "order": 5, "enabled": true}, {"type": "rsvp", "order": 6, "enabled": true}, {"type": "closing", "order": 7, "enabled": true}]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  thumbnail_url = EXCLUDED.thumbnail_url,
  default_theme = EXCLUDED.default_theme,
  default_sections = EXCLUDED.default_sections,
  is_active = EXCLUDED.is_active;
