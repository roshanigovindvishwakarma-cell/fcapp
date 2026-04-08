/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#e8f5e9',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        secondary: '#f3f4f6',
      }
    },
  },
  plugins: [],
}
