/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // POAP Card pastel palette: C #EAC9F8, A #D8F2C8, R #B5AEFF, D #FFEDD6
        card: {
          c: '#EAC9F8',
          a: '#D8F2C8',
          r: '#B5AEFF',
          d: '#FFEDD6',
        },
        primary: {
          DEFAULT: '#6E56CF', // Base purple
          50: '#F3F1FC',
          100: '#E6E1F8',
          200: '#D3C8F3',
          300: '#B5A0EB',
          400: '#9B7CE3',
          500: '#6E56CF',
          600: '#5A42B3',
          700: '#4A3596',
          800: '#3A2A79',
          900: '#2E1F5C',
        },
        // Default colors for better compatibility
        background: '#ffffff',
        foreground: '#1f2937',
      },
    },
  },
  plugins: [],
}