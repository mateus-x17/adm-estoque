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
        // animação personalizada home page
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // animações page auth
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        slideInLeft: 'slideInLeft 0.3s ease-out',
        slideOutLeft: 'slideOutLeft 0.3s ease-out',
        // animação personalizada home page
        gradientShift: "gradientShift 6s ease infinite alternate",
        fadeInUp: "fadeInUp 0.8s ease forwards",
        fadeInDown: "fadeInDown 0.8s ease forwards",
        fadeIn: "fadeIn 1s ease forwards",
      // animações page auth
        fadeIn: "fadeIn 0.6s ease-out",
        slideUp: "slideUp 0.5s ease-out",
      },
    },
  },
  plugins: [],
}