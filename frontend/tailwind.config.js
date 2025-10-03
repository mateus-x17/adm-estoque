/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // habilita dark mode via classe 'dark' no elemento raiz
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        slideInLeft: 'slideInLeft 0.3s ease-out',
        slideOutLeft: 'slideOutLeft 0.3s ease-out',
      },
    },
  },
  plugins: [],
}