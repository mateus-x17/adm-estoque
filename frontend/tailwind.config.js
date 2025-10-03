/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // habilita dark mode via classe 'dark' no elemento raiz
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}