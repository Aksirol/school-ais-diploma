/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', // blue-50 (фони карток)
          100: '#dbeafe', // blue-100 (хедер)
          400: '#60a5fa', // blue-400 (кнопки дій)
          600: '#2563eb', // blue-600 (акценти/ховери)
        },
        accent: {
          50: '#f0fdfa', // teal-50 (статуси)
          400: '#2dd4bf', // teal-400 (оцінки)
        },
        status: {
          success: '#22c55e', // green-500
          danger: '#ef4444', // red-500
          warning: '#f59e0b', // amber-500
        }
      }
    },
  },
  plugins: [],
}