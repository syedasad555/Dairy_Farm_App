/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ─── Brand Greens ─────────────────────────────────────────────
        primary: {
          DEFAULT: '#1E5C0A',   // deep forest green
          light: '#2D7A1A',
          dark: '#143D07',
          50:  '#F0FBE8',
          100: '#DDFAC4',
          200: '#B8F48B',
          500: '#2D7A1A',
          600: '#1E5C0A',
          700: '#143D07',
        },
        // ─── Earthy Browns ────────────────────────────────────────────
        secondary: {
          DEFAULT: '#7C3912',
          light: '#A0522D',
          dark: '#5D2E0C',
          50:  '#FDF4EE',
          100: '#F8DECE',
          500: '#A0522D',
          600: '#7C3912',
        },
        // ─── Sky Blues ────────────────────────────────────────────────
        accent: {
          DEFAULT: '#1A7BBE',
          light: '#4BA3D8',
          dark: '#135D8F',
          50:  '#EBF6FD',
          100: '#C3E3F7',
        },
        // ─── Surfaces ─────────────────────────────────────────────────
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#0F1A0A',    // dark mode background
        },
        surface: {
          DEFAULT: '#F5F9F2', // warm green-tinted white
          dark: '#1A2614',    // dark mode card surface
          card: '#FFFFFF',
          'card-dark': '#243018',
        },
        // ─── Text ─────────────────────────────────────────────────────
        foreground: {
          DEFAULT: '#0F1A0A',
          muted: '#5A6B52',
          'muted-dark': '#8FA882',
          dark: '#F0FBE8',
        },
        muted: '#5A6B52',
        // ─── Status ───────────────────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          light: '#22C55E',
          50: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          50: '#FFFBEB',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          50: '#FEF2F2',
        },
        // ─── Dark Mode ────────────────────────────────────────────────
        dark: {
          bg: '#0F1A0A',
          surface: '#1A2614',
          card: '#243018',
          border: '#2D3D22',
          text: '#E8F5E0',
          muted: '#8FA882',
        },
      },
      fontFamily: {
        sans: ['System'],
        heading: ['System'],
      },
      borderRadius: {
        card: '16px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(30, 92, 10, 0.08)',
        'card-dark': '0 2px 12px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(30, 92, 10, 0.2)',
      },
    },
  },
  plugins: [],
};
