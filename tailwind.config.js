/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#eef2f6',
          panel: '#ffffff',
          header: '#1e293b',
          toolbar: '#f8fafc',
          accent: '#2563eb',
          accentHover: '#1d4ed8',
          border: '#cbd5e1'
        }
      }
    },
  },
  plugins: [],
}

