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
        navy: { 900: '#2C3E50', 800: '#34495E', 700: '#4F617D' },
        action: { 500: '#5E8D7E', 600: '#4A7C77', 100: '#E8F3F1' },
        alert: { 500: '#F97316' }
      }
    },
  },
  plugins: [],
}