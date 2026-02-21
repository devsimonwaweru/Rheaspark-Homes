/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2FA4E7',
        'primary-green': '#3CB371',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'brand': ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}