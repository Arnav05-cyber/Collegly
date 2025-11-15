/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06202B',
        secondary: '#077A7D',
        accent: '#7AE2CF',
        light: '#F5EEDD',
      },
    },
  },
  plugins: [],
}
