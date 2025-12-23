import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
        // DARK BLUE - Lebih gelap dari sebelumnya
        primary: {
          DEFAULT: '#1e40af', // Dark blue (dari #3b82f6)
          dark: '#1e3a8a',    // Darker blue
          light: '#2563eb',   // Medium blue
        },
        // DARK GREEN - Hijau yang lebih gelap dan sophisticated
        emerald: {
          DEFAULT: '#047857', // Dark emerald (dari #10b981)
          dark: '#065f46',    // Darker emerald
          light: '#059669',   // Medium emerald
          300: '#34d399',     // Light emerald
          400: '#10b981',     // Standard emerald
          500: '#059669',     // Dark emerald
          600: '#047857',     // Darker emerald
          700: '#065f46',     // Darkest emerald
        },
        // DARK PASTEL GREEN - Hijau pastel yang lebih dalam
        green: {
          DEFAULT: '#16a34a', // Dark green (dari #22c55e)
          dark: '#15803d',    // Darker green
          light: '#22c55e',   // Medium green
          300: '#4ade80',     // Light pastel green
          400: '#22c55e',     // Standard pastel
          500: '#16a34a',     // Dark pastel
          600: '#15803d',     // Darker pastel
          700: '#166534',     // Darkest pastel
        },
        success: {
          DEFAULT: '#059669', // Dark success (dari #10b981)
          dark: '#047857',
        },
        danger: {
          DEFAULT: '#dc2626', // Darker red (dari #ef4444)
          dark: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'price-up': 'priceUp 0.5s ease-out',
        'price-down': 'priceDown 0.5s ease-out',
      },
      keyframes: {
        priceUp: {
          '0%': { backgroundColor: 'rgba(5, 150, 105, 0.3)' }, // Dark emerald
          '100%': { backgroundColor: 'transparent' },
        },
        priceDown: {
          '0%': { backgroundColor: 'rgba(220, 38, 38, 0.3)' }, // Dark red
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}

export default config