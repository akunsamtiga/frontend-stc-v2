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
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        // Tambahan warna hijau pastel
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        green: {
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
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
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        priceDown: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}

export default config