/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        ink: {
          50: '#FBF5EB',
          100: '#F1E5D4',
          200: '#E4D3B9',
          300: '#C2A483',
          400: '#9B8166',
          500: '#8A6F5E',
          600: '#6B4F3F',
          700: '#4F3A2C',
          800: '#33251B',
          900: '#241208',
          950: '#190B04',
        },
        cream: {
          DEFAULT: '#FFF8EF',
          deep: '#FBEFDF',
          dark: '#F5E6D0',
        },
        surface: '#FFFFFF',
        cacao: {
          DEFAULT: '#3A2318',
          soft: '#6B4F3F',
          deep: '#241208',
        },
        mutedwarm: '#8A6F5E',
        stroke: {
          DEFAULT: '#EFE0CE',
          dark: '#E2CFB6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(51 37 27 / 0.05), 0 1px 3px 0 rgb(51 37 27 / 0.08)',
        lift: '0 8px 24px -8px rgb(51 37 27 / 0.18)',
        glow: '0 0 0 4px rgb(249 115 22 / 0.15)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-in-down': { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'scroll-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
        'role-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-down': 'fade-in-down 0.25s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scroll-down': 'scroll-down 1.5s ease-in-out infinite',
        'role-fade-in': 'role-fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
