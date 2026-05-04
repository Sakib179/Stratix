import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        surface: {
          900: '#0a0f1e',
          800: '#0f1629',
          700: '#111827',
          600: '#1c2436',
          500: '#1f2937',
          400: '#374151',
          300: '#4b5563',
          200: '#6b7280',
          100: '#9ca3af',
          50:  '#d1d5db',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'brand-gradient-subtle': 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
        'surface-gradient': 'linear-gradient(180deg, #0a0f1e 0%, #0f1629 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(17,24,39,0.9), rgba(31,41,55,0.9))',
        'hero-mesh': 'radial-gradient(ellipse at top left, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(139,92,246,0.1) 0%, transparent 60%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':    'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':      'scaleIn 0.2s ease-out',
        'spin-slow':     'spin 3s linear infinite',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite',
        'glow':          'glow 2s ease-in-out infinite alternate',
        'float':         'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:{ from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glow:     { from: { boxShadow: '0 0 20px rgba(99,102,241,0.3)' }, to: { boxShadow: '0 0 40px rgba(139,92,246,0.5)' } },
        float:    { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      boxShadow: {
        'brand':     '0 0 30px rgba(99, 102, 241, 0.3)',
        'brand-sm':  '0 0 15px rgba(99, 102, 241, 0.2)',
        'card':      '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover':'0 8px 40px rgba(0, 0, 0, 0.5)',
        'glow':      '0 0 0 1px rgba(99,102,241,0.3), 0 0 30px rgba(99,102,241,0.15)',
        'inset-brand':'inset 0 0 0 1px rgba(99,102,241,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
