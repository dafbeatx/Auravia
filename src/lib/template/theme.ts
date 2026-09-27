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
  buttonRadius: 'pill',
  cardRadius: 'rounded',
  decorativeStyle: 'classic',
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

  const rawFontHeading = overrideObj.font_heading || defaultObj.font_heading;
  const fontHeading = sanitizeFont(rawFontHeading, DEFAULT_THEME_FALLBACK.fontHeading);

  const rawFontBody = overrideObj.font_body || defaultObj.font_body;
  const fontBody = sanitizeFont(rawFontBody, DEFAULT_THEME_FALLBACK.fontBody);

  const rawColorBackground = overrideObj.color_background || defaultObj.color_background;
  const colorBackground = sanitizeColor(rawColorBackground, DEFAULT_THEME_FALLBACK.colorBackground);

  const rawColorPrimary =
    overrideObj.color_primary ||
    overrideObj.color_foreground ||
    defaultObj.color_primary ||
    defaultObj.color_foreground;
  const colorPrimary = sanitizeColor(rawColorPrimary, DEFAULT_THEME_FALLBACK.colorPrimary);

  const rawColorForeground =
    overrideObj.color_foreground ||
    overrideObj.color_primary ||
    defaultObj.color_foreground ||
    defaultObj.color_primary;
  const colorForeground = sanitizeColor(rawColorForeground, DEFAULT_THEME_FALLBACK.colorForeground);

  const rawColorSurface = overrideObj.color_surface || defaultObj.color_surface;
  const colorSurface = sanitizeColor(rawColorSurface, DEFAULT_THEME_FALLBACK.colorSurface);

  const rawColorBorder = overrideObj.color_border || defaultObj.color_border;
  const colorBorder = sanitizeColor(rawColorBorder, DEFAULT_THEME_FALLBACK.colorBorder);

  const rawColorAccent = overrideObj.color_accent || defaultObj.color_accent || colorPrimary;
  const colorAccent = sanitizeColor(rawColorAccent, colorPrimary);

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
    colorSurface,
    colorBorder,
    colorAccent,
    buttonRadius,
    cardRadius,
    decorativeStyle,
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
    '--theme-color-foreground': theme.colorForeground,
    '--theme-color-surface': theme.colorSurface,
    '--theme-color-border': theme.colorBorder,
    '--theme-color-accent': theme.colorAccent || theme.colorPrimary,
    '--theme-radius-button': buttonRadiusValue,
    '--theme-radius-card': cardRadiusValue,
    '--theme-border-style': borderStyleValue,
  } as CSSProperties;
}
