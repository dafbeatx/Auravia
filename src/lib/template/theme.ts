import type { CSSProperties } from 'react';
import type { NormalizedTheme, TemplateTheme } from './types';

export const DEFAULT_THEME_FALLBACK: NormalizedTheme = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Plus Jakarta Sans',
  colorBackground: '#FAF9F6',
  colorForeground: '#292524',
  colorPrimary: '#292524',
  colorSurface: '#FFFFFF',
  colorBorder: '#E7E5E0',
  colorAccent: '#292524',
};

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

  const fontHeading =
    overrideObj.font_heading?.trim() ||
    defaultObj.font_heading?.trim() ||
    DEFAULT_THEME_FALLBACK.fontHeading;

  const fontBody =
    overrideObj.font_body?.trim() ||
    defaultObj.font_body?.trim() ||
    DEFAULT_THEME_FALLBACK.fontBody;

  const colorBackground =
    overrideObj.color_background?.trim() ||
    defaultObj.color_background?.trim() ||
    DEFAULT_THEME_FALLBACK.colorBackground;

  const colorPrimary =
    overrideObj.color_primary?.trim() ||
    overrideObj.color_foreground?.trim() ||
    defaultObj.color_primary?.trim() ||
    defaultObj.color_foreground?.trim() ||
    DEFAULT_THEME_FALLBACK.colorPrimary;

  const colorForeground =
    overrideObj.color_foreground?.trim() ||
    overrideObj.color_primary?.trim() ||
    defaultObj.color_foreground?.trim() ||
    defaultObj.color_primary?.trim() ||
    DEFAULT_THEME_FALLBACK.colorForeground;

  const colorSurface =
    overrideObj.color_surface?.trim() ||
    defaultObj.color_surface?.trim() ||
    DEFAULT_THEME_FALLBACK.colorSurface;

  const colorBorder =
    overrideObj.color_border?.trim() ||
    defaultObj.color_border?.trim() ||
    DEFAULT_THEME_FALLBACK.colorBorder;

  const colorAccent =
    overrideObj.color_accent?.trim() ||
    defaultObj.color_accent?.trim() ||
    colorPrimary;

  return {
    fontHeading,
    fontBody,
    colorBackground,
    colorForeground,
    colorPrimary,
    colorSurface,
    colorBorder,
    colorAccent,
  };
}

/**
 * Menghasilkan objek style berisikan CSS custom properties untuk diinjeksikan ke kontainer undangan.
 */
export function createThemeStyleVariables(theme: NormalizedTheme): CSSProperties {
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
  } as CSSProperties;
}
