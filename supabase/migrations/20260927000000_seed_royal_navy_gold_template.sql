-- ============================================================================
-- AUROVIA DATABASE SEED: ROYAL NAVY & GOLD TEMPLATE
-- Purpose: Insert the Royal Navy & Gold invitation template inspired by
--          regal royal wedding aesthetics (dark navy, classic gold, Playfair Display)
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
  'royal-navy-gold',
  'Royal Navy & Gold',
  'wedding',
  'Desain undangan pernikahan megah dan khidmat dengan nuansa navy kerajaan dan aksen emas klasik.',
  '/templates/royal-navy-gold/thumbnail.webp',
  '{"font_heading": "Playfair Display", "font_body": "Outfit", "color_background": "#0A1324", "color_primary": "#F8FAFC", "color_foreground": "#F8FAFC", "color_surface": "#132238", "color_border": "#D4AF37", "color_accent": "#D4AF37", "color_accent_soft": "#F6E09C", "color_secondary": "#1E3A5F", "heading_font": "Playfair Display", "body_font": "Outfit", "background": "#0A1324", "primary": "#1E3A5F", "accent": "#D4AF37", "accent_soft": "#F6E09C", "text": "#F8FAFC", "border": "#D4AF37", "button_radius": "pill", "card_radius": "rounded", "decorative_style": "classic"}'::jsonb,
  '[{"type": "hero", "order": 0, "enabled": true}, {"type": "hosts", "order": 1, "enabled": true}, {"type": "events", "order": 2, "enabled": true}, {"type": "story", "order": 3, "enabled": true}, {"type": "gallery", "order": 4, "enabled": true}, {"type": "gift", "order": 5, "enabled": true}, {"type": "rsvp", "order": 6, "enabled": true}, {"type": "wishes", "order": 7, "enabled": true}, {"type": "closing", "order": 8, "enabled": true}]'::jsonb,
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
