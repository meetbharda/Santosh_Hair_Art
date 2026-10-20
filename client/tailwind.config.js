/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#101010',
          800: '#161616',
          700: '#1E1E1E',
          600: '#282828',
          500: '#383838',
        },
        bronze: {
          DEFAULT: '#C5A059',
          light: '#DDC185',
          dark: '#A6823F',
          muted: '#8A6D35',
        },
        ivory: {
          DEFAULT: '#F7F4EE',
          dark: '#EAE6DD',
          light: '#FCFBF8',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
