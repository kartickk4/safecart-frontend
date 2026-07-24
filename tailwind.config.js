/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e56e3',
          600: '#1649cc',
          700: '#0057e6',
          800: '#1c398e',
        },
        surface: {
          bg: '#F7F9FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          hover: '#EDF2F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
