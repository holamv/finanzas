import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        'mv-green': {
          DEFAULT: 'var(--color-mv-green)',
          dark: 'var(--color-mv-green-dark)',
          light: 'var(--color-mv-green-light)',
          pale: 'var(--color-mv-green-pale)',
          50: 'var(--mv-green-50)',
          100: 'var(--mv-green-100)',
          200: 'var(--mv-green-200)',
          300: 'var(--mv-green-300)',
          400: 'var(--mv-green-400)',
          500: 'var(--mv-green-500)',
          600: 'var(--mv-green-600)',
          700: 'var(--mv-green-700)',
          800: 'var(--mv-green-800)',
          900: 'var(--mv-green-900)',
        },
        'mv-orange': {
          DEFAULT: 'var(--color-mv-orange)',
          light: 'var(--color-mv-orange-light)',
          50: 'var(--mv-orange-50)',
          100: 'var(--mv-orange-100)',
          400: 'var(--mv-orange-400)',
          500: 'var(--mv-orange-500)',
          600: 'var(--mv-orange-600)',
        },
        'mv-yellow': {
          DEFAULT: 'var(--color-mv-yellow)',
          50: 'var(--mv-yellow-50)',
          100: 'var(--mv-yellow-100)',
          400: 'var(--mv-yellow-400)',
          500: 'var(--mv-yellow-500)',
          600: 'var(--mv-yellow-600)',
        },
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
    },
  },
  plugins: [],
}
export default config
