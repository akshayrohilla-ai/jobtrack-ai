/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#050D1A',
          900: '#0A1628',
          800: '#0F2040',
          700: '#1A3358',
          600: '#1E4080',
        },
        brand: {
          DEFAULT: '#1B6FEB',
          light: '#3B8AF5',
          pale: '#EBF2FF',
        }
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'elevated': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'brand': '0 4px 14px rgba(27,111,235,0.35)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      }
    },
  },
  plugins: [],
}
