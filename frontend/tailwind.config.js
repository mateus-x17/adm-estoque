/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Mapeando as variáveis CSS definidas no index.css para classes do Tailwind */
        bg: "var(--color-bg)",
        background: "var(--color-bg)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        "border-light": "var(--color-border-light)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
        },
        accent: {
          pink: "var(--color-accent-pink)",
          lilac: "var(--color-accent-lilac)",
          purple: "var(--color-accent-purple)",
          green: "var(--color-accent-green)",
          red: "var(--color-accent-red)",
        }
      },
      borderRadius: {
        'pill': '999px',
        'container': '28px',
        'card': '22px',
        'mini-card': '18px',
      },
      backgroundSize: {
        'gradient-400': '400% 400%',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
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
        gradientShift: "gradientShift 6s ease infinite alternate",
        fadeInUp: "fadeInUp 0.8s ease forwards",
        fadeInDown: "fadeInDown 0.8s ease forwards",
        fadeIn: "fadeIn 0.6s ease-out",
        slideUp: "slideUp 0.5s ease-out",
      },
    },
  },
  plugins: [],
}