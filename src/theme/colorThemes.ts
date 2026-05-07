import type { ColorTheme } from '../store/theme.store';

/**
 * CSS variable overrides per color theme. Each entry mirrors the corresponding
 * `[data-theme="..."]` block in `global.css`, but is consumed at runtime by
 * `<ThemeProvider>` via NativeWind's `vars()` helper — there is no DOM in
 * React Native, so the CSS attribute selectors don't fire on their own.
 *
 * Only `--color-primary*` and `--color-accent*` change between themes;
 * backgrounds, text and borders follow the light/dark mode globally.
 */
type ThemeVars = Record<string, string>;

const OCEAN: ThemeVars = {
  '--color-primary': '14 165 233',
  '--color-primary-dark': '2 132 199',
  '--color-primary-light': '56 189 248',
  '--color-primary-50': '240 249 255',
  '--color-primary-100': '224 242 254',
  '--color-primary-200': '186 230 253',
  '--color-primary-300': '125 211 252',
  '--color-primary-400': '56 189 248',
  '--color-primary-500': '14 165 233',
  '--color-primary-600': '2 132 199',
  '--color-primary-700': '3 105 161',
  '--color-primary-800': '7 89 133',
  '--color-primary-900': '12 74 110',
  '--color-accent': '20 184 166',
  '--color-accent-dark': '13 148 136',
  '--color-accent-light': '45 212 191',
};

const SUNSET: ThemeVars = {
  '--color-primary': '239 68 68',
  '--color-primary-dark': '220 38 38',
  '--color-primary-light': '248 113 113',
  '--color-primary-50': '254 242 242',
  '--color-primary-100': '254 226 226',
  '--color-primary-200': '254 202 202',
  '--color-primary-300': '252 165 165',
  '--color-primary-400': '248 113 113',
  '--color-primary-500': '239 68 68',
  '--color-primary-600': '220 38 38',
  '--color-primary-700': '185 28 28',
  '--color-primary-800': '153 27 27',
  '--color-primary-900': '127 29 29',
  '--color-accent': '251 191 36',
  '--color-accent-dark': '245 158 11',
  '--color-accent-light': '252 211 77',
};

const FOREST: ThemeVars = {
  '--color-primary': '34 197 94',
  '--color-primary-dark': '22 163 74',
  '--color-primary-light': '74 222 128',
  '--color-primary-50': '236 253 245',
  '--color-primary-100': '209 250 229',
  '--color-primary-200': '167 243 208',
  '--color-primary-300': '110 231 183',
  '--color-primary-400': '52 211 153',
  '--color-primary-500': '34 197 94',
  '--color-primary-600': '22 163 74',
  '--color-primary-700': '21 128 61',
  '--color-primary-800': '22 101 52',
  '--color-primary-900': '20 83 45',
  '--color-accent': '139 92 246',
  '--color-accent-dark': '124 58 237',
  '--color-accent-light': '167 139 250',
};

const MIDNIGHT: ThemeVars = {
  '--color-primary': '147 51 234',
  '--color-primary-dark': '124 58 237',
  '--color-primary-light': '168 85 247',
  '--color-primary-50': '250 245 255',
  '--color-primary-100': '243 232 255',
  '--color-primary-200': '233 213 255',
  '--color-primary-300': '216 180 254',
  '--color-primary-400': '196 181 253',
  '--color-primary-500': '168 85 247',
  '--color-primary-600': '147 51 234',
  '--color-primary-700': '126 34 206',
  '--color-primary-800': '107 33 168',
  '--color-primary-900': '88 28 135',
  '--color-accent': '236 72 153',
  '--color-accent-dark': '219 39 119',
  '--color-accent-light': '244 114 182',
};

const PALETTES: Record<ColorTheme, ThemeVars> = {
  default: {},
  ocean: OCEAN,
  sunset: SUNSET,
  forest: FOREST,
  midnight: MIDNIGHT,
};

export function colorThemeVars(theme: ColorTheme): ThemeVars {
  return PALETTES[theme] ?? {};
}

interface ThemeMeta {
  name: string;
  description: string;
  /** Three preview shades (light → mid → dark) shown as overlapping circles. */
  preview: [string, string, string];
}

export const COLOR_THEME_META: Record<ColorTheme, ThemeMeta> = {
  default: {
    name: 'Indigo',
    description: 'Classic and professional',
    preview: ['#a5b4fc', '#6366f1', '#4338ca'],
  },
  ocean: {
    name: 'Ocean',
    description: 'Cool blues and teals',
    preview: ['#7dd3fc', '#0ea5e9', '#0369a1'],
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm reds and ambers',
    preview: ['#fca5a5', '#ef4444', '#b91c1c'],
  },
  forest: {
    name: 'Forest',
    description: 'Fresh greens',
    preview: ['#86efac', '#22c55e', '#15803d'],
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep purples',
    preview: ['#d8b4fe', '#a855f7', '#7e22ce'],
  },
};

export const THEME_ORDER: ColorTheme[] = ['default', 'ocean', 'sunset', 'forest', 'midnight'];
