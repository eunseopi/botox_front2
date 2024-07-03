/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customDarkBlue: '#102C57',
        customPrimary: '#93A2D8',
        customLightGray: '#6778AB',
        customTopNav: '#393939',
        customSearchBg: '#2f2f2f',
        customMainBg: '#2c2c2c',
        customLoginBg: '#e0dddd',
        customLoginBtn: '#dddddd',
        customBoardBg: '#484545',
        customIdBg: '#676666',
      }
    },
  },
  plugins: [],
}

