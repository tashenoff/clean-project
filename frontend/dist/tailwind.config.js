module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0066cc',
          dark: '#004c99',
        },
        secondary: {
          light: '#ffd699',
          DEFAULT: '#ff9900',
          dark: '#cc7a00',
        },
        gray: {
          lightest: '#f8f9fa',
          light: '#e9ecef',
          DEFAULT: '#dee2e6',
          dark: '#adb5bd',
          darkest: '#343a40',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      }
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active', 'disabled'],
      textColor: ['active', 'disabled'],
      borderColor: ['active', 'disabled'],
    },
  },
  plugins: [],
}
