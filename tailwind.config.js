import containerQueries from '@tailwindcss/container-queries'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        'bg-soft': 'rgb(var(--c-bg-soft) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--c-surface-3) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        'border-soft': 'rgb(var(--c-border-soft) / <alpha-value>)',
        content: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          soft: 'rgb(var(--c-primary-soft) / <alpha-value>)',
          contrast: 'rgb(var(--c-primary-contrast) / <alpha-value>)',
        },
        income: 'rgb(var(--c-income) / <alpha-value>)',
        'income-soft': 'rgb(var(--c-income-soft) / <alpha-value>)',
        expense: 'rgb(var(--c-expense) / <alpha-value>)',
        'expense-soft': 'rgb(var(--c-expense-soft) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',
        'info-soft': 'rgb(var(--c-info-soft) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--c-warning-soft) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -12px rgb(0 0 0 / 0.25)',
        'card-lg': '0 2px 4px rgb(0 0 0 / 0.08), 0 24px 48px -20px rgb(0 0 0 / 0.35)',
        glow: '0 0 0 1px rgb(var(--c-primary) / 0.4), 0 8px 32px -8px rgb(var(--c-primary) / 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'count-pop': {
          '0%': { transform: 'scale(0.9)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.6s infinite',
        'count-pop': 'count-pop 0.4s ease-out',
      },
    },
  },
  plugins: [containerQueries],
}
