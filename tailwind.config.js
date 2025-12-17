/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Material Design 3 Color System
      colors: {
        // Primary Tonal Palette (Aviation Blue)
        primary: {
          0: '#000000',
          10: '#001d36',
          20: '#003258',
          25: '#003f6b',
          30: '#004c7e',
          35: '#005a92',
          40: '#0068a6',
          50: '#0085d1',
          60: '#00a3ff',
          70: '#4fc3ff',
          80: '#7dd5ff',
          90: '#c2e8ff',
          95: '#e1f4ff',
          98: '#f8fcff',
          99: '#fdfcff',
          100: '#ffffff',
        },
        // Secondary Tonal Palette (Sky Blue)
        secondary: {
          0: '#000000',
          10: '#0f1419',
          20: '#24292e',
          25: '#2f3439',
          30: '#3a3f44',
          35: '#464b50',
          40: '#52575c',
          50: '#6b7075',
          60: '#858a8f',
          70: '#9fa4a9',
          80: '#babfc4',
          90: '#d6dbe0',
          95: '#e4e9ee',
          98: '#f2f7fc',
          99: '#f8fcff',
          100: '#ffffff',
        },
        // Tertiary Tonal Palette (Accent)
        tertiary: {
          0: '#000000',
          10: '#2d1600',
          20: '#472800',
          25: '#543000',
          30: '#613800',
          35: '#6f4100',
          40: '#7d4a00',
          50: '#9a5d00',
          60: '#b87100',
          70: '#d68600',
          80: '#f59c00',
          90: '#ffb951',
          95: '#ffdc9e',
          98: '#fff1e0',
          99: '#fffbf7',
          100: '#ffffff',
        },
        // Neutral Tonal Palette
        neutral: {
          0: '#000000',
          4: '#0f0f0f',
          6: '#141414',
          10: '#1a1a1a',
          12: '#1f1f1f',
          17: '#2a2a2a',
          20: '#313131',
          22: '#363636',
          24: '#3a3a3a',
          25: '#3d3d3d',
          30: '#484848',
          35: '#545454',
          40: '#606060',
          50: '#787878',
          60: '#919191',
          70: '#ababab',
          80: '#c6c6c6',
          87: '#dcdcdc',
          90: '#e3e3e3',
          92: '#e9e9e9',
          94: '#f0f0f0',
          95: '#f4f4f4',
          96: '#f7f7f7',
          98: '#fcfcfc',
          99: '#fefefe',
          100: '#ffffff',
        },
        // Neutral Variant Tonal Palette
        'neutral-variant': {
          0: '#000000',
          10: '#191c20',
          20: '#2e3135',
          25: '#393c41',
          30: '#44474c',
          35: '#505358',
          40: '#5c5f64',
          50: '#75787d',
          60: '#8e9197',
          70: '#a9acb1',
          80: '#c4c7cc',
          90: '#e0e3e8',
          95: '#eef1f6',
          98: '#f8fafe',
          99: '#fcfcff',
          100: '#ffffff',
        },
        // Error Tonal Palette
        error: {
          0: '#000000',
          10: '#410002',
          20: '#690005',
          25: '#7e0007',
          30: '#93000a',
          35: '#a80710',
          40: '#ba1a1a',
          50: '#de3730',
          60: '#ff5449',
          70: '#ff897d',
          80: '#ffb4ab',
          90: '#ffdad6',
          95: '#ffedea',
          98: '#fff8f7',
          99: '#fffbff',
          100: '#ffffff',
        },
        // Surface Colors (Light Theme)
        surface: {
          DEFAULT: 'rgb(var(--md-sys-color-surface) / <alpha-value>)',
          dim: 'rgb(var(--md-sys-color-surface-dim) / <alpha-value>)',
          bright: 'rgb(var(--md-sys-color-surface-bright) / <alpha-value>)',
          'container-lowest': 'rgb(var(--md-sys-color-surface-container-lowest) / <alpha-value>)',
          'container-low': 'rgb(var(--md-sys-color-surface-container-low) / <alpha-value>)',
          container: 'rgb(var(--md-sys-color-surface-container) / <alpha-value>)',
          'container-high': 'rgb(var(--md-sys-color-surface-container-high) / <alpha-value>)',
          'container-highest': 'rgb(var(--md-sys-color-surface-container-highest) / <alpha-value>)',
        },
        // Semantic Colors
        'on-primary': 'rgb(var(--md-sys-color-on-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--md-sys-color-primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--md-sys-color-on-primary-container) / <alpha-value>)',
        'on-secondary': 'rgb(var(--md-sys-color-on-secondary) / <alpha-value>)',
        'secondary-container': 'rgb(var(--md-sys-color-secondary-container) / <alpha-value>)',
        'on-secondary-container': 'rgb(var(--md-sys-color-on-secondary-container) / <alpha-value>)',
        'on-tertiary': 'rgb(var(--md-sys-color-on-tertiary) / <alpha-value>)',
        'tertiary-container': 'rgb(var(--md-sys-color-tertiary-container) / <alpha-value>)',
        'on-tertiary-container': 'rgb(var(--md-sys-color-on-tertiary-container) / <alpha-value>)',
        'on-surface': 'rgb(var(--md-sys-color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--md-sys-color-on-surface-variant) / <alpha-value>)',
        outline: 'rgb(var(--md-sys-color-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--md-sys-color-outline-variant) / <alpha-value>)',
        'on-error': 'rgb(var(--md-sys-color-on-error) / <alpha-value>)',
        'error-container': 'rgb(var(--md-sys-color-error-container) / <alpha-value>)',
        'on-error-container': 'rgb(var(--md-sys-color-on-error-container) / <alpha-value>)',
        'inverse-surface': 'rgb(var(--md-sys-color-inverse-surface) / <alpha-value>)',
        'inverse-on-surface': 'rgb(var(--md-sys-color-inverse-on-surface) / <alpha-value>)',
        'inverse-primary': 'rgb(var(--md-sys-color-inverse-primary) / <alpha-value>)',
        scrim: 'rgb(var(--md-sys-color-scrim) / <alpha-value>)',
        shadow: 'rgb(var(--md-sys-color-shadow) / <alpha-value>)',
      },
      // Material Design 3 Typography Scale
      fontSize: {
        // Display
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '400' }],
        // Headline
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '400' }],
        // Title
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '400' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        // Label
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        // Body
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      // Material Design 3 Spacing (8dp grid)
      spacing: {
        '0.5': '2px',   // 0.25 * 8dp
        '1': '4px',     // 0.5 * 8dp
        '1.5': '6px',   // 0.75 * 8dp
        '2': '8px',     // 1 * 8dp
        '3': '12px',    // 1.5 * 8dp
        '4': '16px',    // 2 * 8dp
        '5': '20px',    // 2.5 * 8dp
        '6': '24px',    // 3 * 8dp
        '7': '28px',    // 3.5 * 8dp
        '8': '32px',    // 4 * 8dp
        '10': '40px',   // 5 * 8dp
        '12': '48px',   // 6 * 8dp
        '16': '64px',   // 8 * 8dp
        '20': '80px',   // 10 * 8dp
        '24': '96px',   // 12 * 8dp
        '32': '128px',  // 16 * 8dp
      },
      // Material Design 3 Border Radius
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '28px',
        'full': '9999px',
      },
      // Material Design 3 Elevation (Box Shadows)
      boxShadow: {
        'elevation-0': 'none',
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-5': '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
      },
      // Material Design 3 Animations
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.2, 0, 0, 1)',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 1, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.2, 0, 0, 1)',
        'slide-down': 'slideDown 300ms cubic-bezier(0.2, 0, 0, 1)',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.2, 0, 0, 1)',
        'scale-out': 'scaleOut 150ms cubic-bezier(0.4, 0, 1, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      // Material Design 3 Container Sizes
      maxWidth: {
        'container': '1200px',
      },
    },
  },
  plugins: [],
}