import React, { useMemo } from 'react';
import type { NormalizedTheme } from '@/lib/template/types';
import { normalizeTheme, createThemeStyleVariables } from '@/lib/template/theme';

export interface ThemeInjectorProps {
  theme?: NormalizedTheme;
  defaultTheme?: unknown;
  themeOverride?: unknown;
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'main';
}

/**
 * ThemeInjector:
 * Menerapkan tema undangan secara scoped ke kontainer undangan.
 * Menghasilkan CSS custom properties (--theme-*) sehingga renderer tidak perlu inline style berlebihan.
 */
export const ThemeInjector: React.FC<ThemeInjectorProps> = ({
  theme,
  defaultTheme,
  themeOverride,
  children,
  className = '',
  as: Component = 'div',
}) => {
  const resolvedTheme = useMemo(() => {
    if (theme) return theme;
    return normalizeTheme(defaultTheme, themeOverride);
  }, [theme, defaultTheme, themeOverride]);

  const styleVariables = useMemo(() => {
    return createThemeStyleVariables(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <Component
      style={styleVariables}
      className={`min-h-screen transition-colors duration-150 bg-[var(--theme-color-bg)] text-[var(--theme-color-foreground)] font-[family-name:var(--theme-font-body)] ${className}`}
    >
      {children}
    </Component>
  );
};
