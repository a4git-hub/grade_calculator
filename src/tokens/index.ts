import { Platform } from 'react-native';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  hairline: string;
  hairline2: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accent2: string;
  ink: string;
  inkSoft: string;
  accentSoft: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  tabBg: string;
}

export const LuminaTokens: { dark: ThemeTokens; light: ThemeTokens } = {
  dark: {
    bg:         '#070C14',
    surface:    '#0E1620',
    surface2:   '#16202C',
    surface3:   '#1E2A38',
    hairline:   'rgba(255,255,255,0.06)',
    hairline2:  'rgba(255,255,255,0.10)',
    text:       '#F2F5F9',
    text2:      '#A6B2C2',
    text3:      '#6F7E92',
    accent:     '#5BC8C2',
    accent2:    '#2E8C9A',
    ink:        '#3E7BFA',
    inkSoft:    'rgba(62,123,250,0.15)',
    accentSoft: 'rgba(91,200,194,0.14)',
    good:       '#4ECF8B',
    goodSoft:   'rgba(78,207,139,0.14)',
    warn:       '#F2B450',
    warnSoft:   'rgba(242,180,80,0.14)',
    bad:        '#F56C6C',
    badSoft:    'rgba(245,108,108,0.14)',
    tabBg:      'rgba(14,22,32,0.95)',
  },
  light: {
    bg:         '#F4F6FA',
    surface:    '#FFFFFF',
    surface2:   '#FFFFFF',
    surface3:   '#EEF1F6',
    hairline:   'rgba(8,18,32,0.07)',
    hairline2:  'rgba(8,18,32,0.12)',
    text:       '#0B1220',
    text2:      '#4F5C6E',
    text3:      '#7A8696',
    accent:     '#0F8C8A',
    accent2:    '#0A6E6C',
    ink:        '#1F5BD6',
    inkSoft:    'rgba(31,91,214,0.10)',
    accentSoft: 'rgba(15,140,138,0.10)',
    good:       '#1B9A5A',
    goodSoft:   'rgba(27,154,90,0.10)',
    warn:       '#B7791F',
    warnSoft:   'rgba(183,121,31,0.10)',
    bad:        '#C8362F',
    badSoft:    'rgba(200,54,47,0.10)',
    tabBg:      'rgba(255,255,255,0.95)',
  },
};

export const Fonts = {
  ui:   Platform.select({ ios: undefined, android: undefined }),  // system default
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

// Mono kicker text — shared style factory
export const monoStyle = (T: ThemeTokens) => ({
  fontFamily: Fonts.mono,
  fontSize: 10,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
  color: T.text3,
  fontWeight: '500' as const,
});

export function gradeColor(T: ThemeTokens, color: 'good' | 'warn' | 'bad'): string {
  return color === 'good' ? T.good : color === 'warn' ? T.warn : T.bad;
}
