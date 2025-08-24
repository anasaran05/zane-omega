
/**
 * Theme tokens and design system constants
 * Based on the dark theme extracted from the provided screenshots
 */

export const colors = {
  // Base palette
  background: {
    primary: '#0F0F10',
    secondary: '#141414', 
    elevated: '#1B1B1D'
  },
  
  // Primary brand
  primary: {
    DEFAULT: '#E63946',
    hover: '#C5303F',
    foreground: '#FFFFFF'
  },
  
  // Surface colors
  surface: {
    DEFAULT: '#141414',
    elevated: '#1B1B1D',
    overlay: '#121214'
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#BDBDBD',
    muted: '#8A8A8A'
  },
  
  // State colors
  success: {
    DEFAULT: '#22C55E',
    foreground: '#FFFFFF'
  },
  
  error: {
    DEFAULT: '#EF4444',
    foreground: '#FFFFFF'
  },
  
  warning: {
    DEFAULT: '#F59E0B',
    foreground: '#FFFFFF'
  }
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    heading: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }]
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
} as const;

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem'    // 96px
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '10px',
  xl: '14px',
  '2xl': '18px',
  full: '9999px'
} as const;

export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.4)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 6px 18px rgba(0, 0, 0, 0.6)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.7)',
  glow: '0 0 20px rgba(230, 57, 70, 0.3)',
  glowHover: '0 0 30px rgba(230, 57, 70, 0.5)'
} as const;

export const transitions = {
  fast: '200ms ease-out',
  normal: '300ms ease-out',
  slow: '500ms ease-out'
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060
} as const;

// Component variants
export const buttonVariants = {
  primary: {
    background: colors.primary.DEFAULT,
    color: colors.primary.foreground,
    hover: {
      background: colors.primary.hover
    }
  },
  outline: {
    background: 'transparent',
    color: colors.primary.DEFAULT,
    border: `1px solid ${colors.primary.DEFAULT}`,
    hover: {
      background: colors.primary.DEFAULT,
      color: colors.primary.foreground
    }
  },
  disabled: {
    background: colors.surface.elevated,
    color: colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.5
  }
} as const;

export const cardVariants = {
  default: {
    background: colors.surface.overlay,
    border: `1px solid ${colors.surface.elevated}`,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.md
  },
  elevated: {
    background: colors.surface.elevated,
    border: `1px solid ${colors.surface.elevated}`,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.lg
  }
} as const;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  buttonVariants,
  cardVariants
};
