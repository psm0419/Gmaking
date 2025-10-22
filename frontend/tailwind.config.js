/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/account/LoginPage.js",
  ],
  theme: {
    extend: {
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }, 
        },
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}