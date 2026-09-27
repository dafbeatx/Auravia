import type { CSSProperties } from 'react';
import type {
  NormalizedTheme,
  TemplateTheme,
  ButtonRadiusStyle,
  CardRadiusStyle,
  DecorativeStyle,
} from './types';

export const DEFAULT_THEME_FALLBACK: NormalizedTheme = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Plus Jakarta Sans',
  colorBackground: '#FAF9F6',
  colorForeground: '#292524',
  colorPrimary: '#292524',
  colorSurface: '#FFFFFF',
  colorBorder: '#E7E5E0',
  colorAccent: '#292524',
  colorMuted: '#78716C',
  buttonRadius: 'pill',
  cardRadius: 'rounded',
  decorativeStyle: 'classic',
  containerWidth: '48rem',
};

/**
 * Validasi warna CSS hex atau rgb/hsl untuk mencegah injeksi nilai tidak aman
 */
function sanitizeColor(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const s = val.trim();
  // Validasi format hex 3/4/6/8 digit
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) {
    return s;
  }
  // Validasi rgb/rgba/hsl/hsla sederhana
  if (/^(rgb|hsl)a?\([0-9.,%\s-]+\)$/i.test(s)) {
    return s;
  }
  return fallback;
}

/**
 * Validasi nama font yang aman (hanya alfanumerik, spasi, dan tanda hubung)
 */
function sanitizeFont(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const s = val.trim();
  if (/^[a-zA-Z0-9\s-]+$/.test(s) && s.length <= 50) {
    return s;
  }
  return fallback;
}

/**
 * Validasi token radius tombol
 */
function sanitizeButtonRadius(val: unknown, fallback: ButtonRadiusStyle): ButtonRadiusStyle {
  if (val === 'pill' || val === 'rounded' || val === 'sharp') {
    return val;
  }
  return fallback;
}

/**
 * Validasi token radius kartu
 */
function sanitizeCardRadius(val: unknown, fallback: CardRadiusStyle): CardRadiusStyle {
  if (val === 'rounded' || val === 'subtle' || val === 'sharp') {
    return val;
  }
  return fallback;
}

/**
 * Validasi token dekorasi
 */
function sanitizeDecorativeStyle(val: unknown, fallback: DecorativeStyle): DecorativeStyle {
  if (val === 'classic' || val === 'minimal' || val === 'bordered') {
    return val;
  }
  return fallback;
}

/**
 * Menggabungkan default_theme dari template master dengan theme_override dari invitation.
 * Urutan prioritas jelas: invitation override > template default > fallback aman.
 * Menghasilkan tema terstruktur yang aman dan konsisten.
 */
export function normalizeTheme(
  defaultThemeRaw: unknown,
  themeOverrideRaw?: unknown
): NormalizedTheme {
  const defaultObj = (typeof defaultThemeRaw === 'object' && defaultThemeRaw !== null
    ? defaultThemeRaw
    : {}) as TemplateTheme;

  const overrideObj = (typeof themeOverrideRaw === 'object' && themeOverrideRaw !== null
    ? themeOverrideRaw
    : {}) as TemplateTheme;

  const rawFontHeading =
    overrideObj.font_heading ||
    overrideObj.heading_font ||
    defaultObj.font_heading ||
    defaultObj.heading_font;
  const fontHeading = sanitizeFont(rawFontHeading, DEFAULT_THEME_FALLBACK.fontHeading);

  const rawFontBody =
    overrideObj.font_body ||
    overrideObj.body_font ||
    defaultObj.font_body ||
    defaultObj.body_font;
  const fontBody = sanitizeFont(rawFontBody, DEFAULT_THEME_FALLBACK.fontBody);

  const rawColorBackground =
    overrideObj.color_background ||
    overrideObj.background ||
    defaultObj.color_background ||
    defaultObj.background;
  const colorBackground = sanitizeColor(rawColorBackground, DEFAULT_THEME_FALLBACK.colorBackground);

  const rawColorPrimary =
    overrideObj.color_primary ||
    overrideObj.primary ||
    overrideObj.color_foreground ||
    overrideObj.text ||
    defaultObj.color_primary ||
    defaultObj.primary ||
    defaultObj.color_foreground ||
    defaultObj.text;
  const colorPrimary = sanitizeColor(rawColorPrimary, DEFAULT_THEME_FALLBACK.colorPrimary);

  const rawColorSecondary =
    overrideObj.color_secondary ||
    overrideObj.secondary ||
    defaultObj.color_secondary ||
    defaultObj.secondary;
  const colorSecondary = rawColorSecondary ? sanitizeColor(rawColorSecondary, '#1E3A5F') : '#1E3A5F';

  const rawColorForeground =
    overrideObj.color_foreground ||
    overrideObj.text ||
    overrideObj.color_primary ||
    overrideObj.primary ||
    defaultObj.color_foreground ||
    defaultObj.text ||
    defaultObj.color_primary ||
    defaultObj.primary;
  const colorForeground = sanitizeColor(rawColorForeground, DEFAULT_THEME_FALLBACK.colorForeground);

  const rawColorSurface =
    overrideObj.color_surface ||
    overrideObj.surface ||
    defaultObj.color_surface ||
    defaultObj.surface;
  const colorSurface = sanitizeColor(rawColorSurface, DEFAULT_THEME_FALLBACK.colorSurface);

  const rawColorBorder =
    overrideObj.color_border ||
    overrideObj.border ||
    defaultObj.color_border ||
    defaultObj.border;
  const colorBorder = sanitizeColor(rawColorBorder, DEFAULT_THEME_FALLBACK.colorBorder);

  const rawColorAccent =
    overrideObj.color_accent ||
    overrideObj.accent ||
    defaultObj.color_accent ||
    defaultObj.accent ||
    colorPrimary;
  const colorAccent = sanitizeColor(rawColorAccent, colorPrimary);

  const rawColorAccentSoft =
    overrideObj.color_accent_soft ||
    overrideObj.accent_soft ||
    defaultObj.color_accent_soft ||
    defaultObj.accent_soft;
  const colorAccentSoft = rawColorAccentSoft ? sanitizeColor(rawColorAccentSoft, '#F6E09C') : '#F6E09C';

  const rawColorMuted =
    overrideObj.color_muted ||
    overrideObj.colorMuted ||
    defaultObj.color_muted ||
    defaultObj.colorMuted;
  const colorMuted = rawColorMuted ? sanitizeColor(rawColorMuted, DEFAULT_THEME_FALLBACK.colorMuted || '#78716C') : DEFAULT_THEME_FALLBACK.colorMuted;

  const rawContainerWidth =
    overrideObj.container_width ||
    overrideObj.containerWidth ||
    defaultObj.container_width ||
    defaultObj.containerWidth;
  const containerWidth =
    typeof rawContainerWidth === 'string' && rawContainerWidth.trim()
      ? rawContainerWidth.trim()
      : DEFAULT_THEME_FALLBACK.containerWidth;

  const rawButtonRadius = overrideObj.button_radius || defaultObj.button_radius;
  const buttonRadius = sanitizeButtonRadius(rawButtonRadius, DEFAULT_THEME_FALLBACK.buttonRadius);

  const rawCardRadius = overrideObj.card_radius || defaultObj.card_radius;
  const cardRadius = sanitizeCardRadius(rawCardRadius, DEFAULT_THEME_FALLBACK.cardRadius);

  const rawDecorativeStyle = overrideObj.decorative_style || defaultObj.decorative_style;
  const decorativeStyle = sanitizeDecorativeStyle(
    rawDecorativeStyle,
    DEFAULT_THEME_FALLBACK.decorativeStyle
  );

  return {
    fontHeading,
    fontBody,
    colorBackground,
    colorForeground,
    colorPrimary,
    colorSecondary,
    colorSurface,
    colorBorder,
    colorAccent,
    colorAccentSoft,
    colorMuted,
    buttonRadius,
    cardRadius,
    decorativeStyle,
    containerWidth,
  };
}

/**
 * Menghasilkan objek style berisikan CSS custom properties untuk diinjeksikan ke kontainer undangan.
 */
export function createThemeStyleVariables(theme: NormalizedTheme): CSSProperties {
  const buttonRadiusValue =
    theme.buttonRadius === 'sharp' ? '0px' : theme.buttonRadius === 'rounded' ? '8px' : '9999px';
  const cardRadiusValue =
    theme.cardRadius === 'sharp' ? '0px' : theme.cardRadius === 'subtle' ? '8px' : '16px';
  const borderStyleValue = theme.decorativeStyle === 'minimal' ? 'none' : 'solid';

  return {
    '--theme-font-heading': `"${theme.fontHeading}", 'Cormorant Garamond', Georgia, serif`,
    '--theme-font-body': `"${theme.fontBody}", 'Plus Jakarta Sans', system-ui, sans-serif`,
    '--theme-color-bg': theme.colorBackground,
    '--theme-color-background': theme.colorBackground,
    '--theme-color-primary': theme.colorPrimary,
    '--theme-color-secondary': theme.colorSecondary || '#1E3A5F',
    '--theme-color-foreground': theme.colorForeground,
    '--theme-color-surface': theme.colorSurface,
    '--theme-color-border': theme.colorBorder,
    '--theme-color-accent': theme.colorAccent || theme.colorPrimary,
    '--theme-color-accent-soft': theme.colorAccentSoft || '#F6E09C',
    '--theme-color-muted': theme.colorMuted || '#78716C',
    '--theme-container-width': theme.containerWidth || '48rem',
    '--theme-max-width': theme.containerWidth || '48rem',
    '--theme-radius-button': buttonRadiusValue,
    '--theme-radius-card': cardRadiusValue,
    '--theme-border-style': borderStyleValue,
  } as CSSProperties;
}
