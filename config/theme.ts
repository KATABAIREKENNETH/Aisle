export const theme = {
  colors: {
    primary: {
      default: '#D0002E',
      light: '#FF2D55',
      dark: '#960021',
    },
    secondary: {
      default: '#B5005A',
      light: '#E8007A',
      dark: '#7A003C',
    },
    accent: {
      default: '#005FCC',
      light: '#2D8AFF',
      dark: '#003F8A',
    },
    error: {
      default: '#C0392B',
      light: '#E85D4A',
      dark: '#8B2518',
    },
    success: {
      default: '#0A7A4A',
      light: '#12A864',
      dark: '#065230',
    },
    warning: {
      default: '#B45309',
      light: '#F59E0B',
      dark: '#783A06',
    },
    info: {
      default: '#0077B6',
      light: '#00A8E8',
      dark: '#005280',
    },
    background: '#F8F4F9',
    surface: {
      default: '#FFFFFF',
      raised: '#F0EAF2',
      overlay: '#E5DCE8',
    },
    border: {
      subtle: '#EAE1ED',
      default: '#D6C8D9',
      strong: '#BCA8C0',
    },
    text: {
      primary: '#2D2330',
      secondary: '#5C4E60',
      disabled: '#988B9C',
      inverse: '#FFFFFF',
    },
  },
  // Convenience exports for direct color access
  primary: '#D0002E',
  secondary: '#B5005A',
  accent: '#005FCC',
  error: '#C0392B',
  success: '#0A7A4A',
  warning: '#B45309',
  info: '#0077B6',
  background: '#F8F4F9',
  surface: '#FFFFFF',
  border: '#D6C8D9',
  text: '#2D2330',
  textSecondary: '#5C4E60',
  textDisabled: '#988B9C',
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    // Display fonts for hero moments, couple names
    display: {
      primary: 'PlayfairDisplay',
      secondary: 'LibreBaskerville_Italic',
    },
    // UI and body fonts
    ui: {
      default: 'Figtree',
      regular: 'Figtree_400Regular',
      medium: 'Figtree_500Medium',
      semibold: 'Figtree_600SemiBold',
    },
    // Numeric fonts for budget, dates, stats
    numeric: {
      default: 'BarlowCondensed',
      medium: 'BarlowCondensed_500Medium',
    },
    // Monospace for timestamps, IDs, hex refs
    mono: {
      default: 'DMMono',
    },
  },
  typography: {
    // Couple names, hero countdown - Romance, occasion, drama on dark bg
    hero: {
      fontFamily: 'LibreBaskerville_Italic',
      fontSize: 48,
      fontWeight: '400',
    },
    // Screen titles, section heads - Warm but structured, not cold
    heading: {
      fontFamily: 'Figtree_600SemiBold',
      fontSize: 32,
      fontWeight: '600',
    },
    // Body, descriptions, labels - Consistent with titles, effortless reading
    body: {
      fontFamily: 'Figtree_400Regular',
      fontSize: 16,
      fontWeight: '400',
    },
    // Buttons - Slightly lighter than headings, still assertive
    button: {
      fontFamily: 'Figtree_500Medium',
      fontSize: 16,
      fontWeight: '500',
    },
    // Stat numbers, budget amounts - Rhythmic, compact, dashboard-like
    stat: {
      fontFamily: 'BarlowCondensed_500Medium',
      fontSize: 24,
      fontWeight: '500',
    },
    // Timestamps, IDs, hex refs
    mono: {
      fontFamily: 'DMMono_400Regular',
      fontSize: 12,
      fontWeight: '400',
    },
  },
} as const;
