/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        navy: { 950: '#0B1120', 900: '#0F172A', 800: '#1E293B', 700: '#334155' },
        action: { 500: '#10B981', 600: '#059669', 100: '#D1FAE5' }, // Emerald for "Renew" vibe
        tera: { 500: '#5E8D7E', 900: '#2C3E50' }, // Original Brand Colors kept for accents
        alert: { 500: '#F97316' }
      }
    },
  },
  plugins: [],
}