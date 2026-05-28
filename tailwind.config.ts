import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
    },
    extend: {
      colors: {
        brand: {
          primary: '#1F3A5F',
          secondary: '#2E5C8A',
          accent: '#3A6FA5',
          light: '#E8EEF7',
          bg: '#F5F8FC',
        },
        border: 'hsl(220 13% 91%)',
        ring: 'hsl(214 84% 36%)',
        background: '#FFFFFF',
        foreground: '#0B1220',
        muted: { DEFAULT: '#F1F5F9', foreground: '#64748B' },
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
