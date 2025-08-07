/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/js/**/*.js", "./dist/app.js"],
  safelist: [
    'sr-only',
    'focus:not-sr-only',
    'focus:absolute',
    'focus:top-4',
    'focus:left-4',
    '-translate-y-full',
    'focus:translate-y-4'
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1600px',
        '4xl': '1920px',
        '5xl': '2560px'
      },
      colors: {
        primary: '#8b5cf6',
        secondary: '#06b6d4',
        background: '#161616'
      },
      fontFamily: {
        'heading': ['Funnel Display', 'sans-serif'],
        'sans': ['Funnel Display', 'sans-serif']
      }
    },
  },
  plugins: [],
}