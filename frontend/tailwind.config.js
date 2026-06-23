/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D5016',
          light: '#3D6B1E',
          dark: '#1E3A0F',
        },
        secondary: {
          DEFAULT: '#8B4513',
          light: '#A0522D',
          dark: '#5D2E0C',
        },
        accent: {
          DEFAULT: '#87CEEB',
          light: '#B0E0F6',
          dark: '#5BAFD4',
        },
        background: '#FFFFFF',
        surface: '#F8F6F3',
        muted: '#6B7280',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
