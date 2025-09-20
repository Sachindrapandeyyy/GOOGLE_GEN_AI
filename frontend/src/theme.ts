/**
 * Sukoon AI - Design System
 * 
 * This file contains the design tokens and theme configuration
 * for the Sukoon AI frontend application.
 */

export const theme = {
  colors: {
    // Primary colors
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa', // Main purple
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    // Secondary colors (pink)
    secondary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4', // Main pink
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    // Accent colors (blue)
    accent: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa', // Main blue
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Neutrals
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Nunito, Inter, system-ui, sans-serif',
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(to right, #a78bfa, #8b5cf6)',
    secondary: 'linear-gradient(to right, #f9a8d4, #ec4899)',
    accent: 'linear-gradient(to right, #60a5fa, #3b82f6)',
    purple: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
    pink: 'linear-gradient(135deg, #fbcfe8, #f9a8d4)',
    blue: 'linear-gradient(135deg, #bfdbfe, #60a5fa)',
    mixed: 'linear-gradient(135deg, #a78bfa, #f9a8d4, #60a5fa)',
    calmBackground: 'linear-gradient(135deg, #f5f3ff, #eff6ff, #fdf2f8)',
  },

  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    verySlow: '1000ms',
  },

  // Transitions
  transitions: {
    default: 'all 0.3s ease',
    bounce: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Tailwind class helpers
export const tailwindClasses = {
  // Card styles
  card: {
    base: 'bg-white rounded-2xl shadow-md p-6 transition-all duration-300',
    hover: 'hover:shadow-lg hover:translate-y-[-2px]',
    active: 'active:shadow-md active:translate-y-0',
  },
  // Button styles
  button: {
    base: 'font-medium rounded-xl transition-all duration-300 flex items-center justify-center',
    primary: 'bg-primary-400 text-white hover:bg-primary-500 active:bg-primary-600',
    secondary: 'bg-secondary-300 text-white hover:bg-secondary-400 active:bg-secondary-500',
    accent: 'bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600',
    outline: 'border-2 border-primary-400 text-primary-400 hover:bg-primary-50',
    ghost: 'text-primary-400 hover:bg-primary-50',
    sizes: {
      sm: 'text-sm py-2 px-3',
      md: 'text-base py-2.5 px-4',
      lg: 'text-lg py-3 px-5',
    },
  },
  // Input styles
  input: {
    base: 'w-full rounded-xl border border-neutral-200 px-4 py-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
  },
  // Text styles
  text: {
    heading1: 'font-heading text-3xl font-bold text-neutral-800',
    heading2: 'font-heading text-2xl font-bold text-neutral-800',
    heading3: 'font-heading text-xl font-bold text-neutral-800',
    body: 'font-body text-base text-neutral-700',
    caption: 'font-body text-sm text-neutral-500',
  },
};

export default theme;
