/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#11458B',
        'primary-light': '#F4F6F9',
        'text-dark': '#343A40',
      },
      spacing: {
        'sidebar-sm': '220px',  // lg breakpoint
        'sidebar-lg': '270px',  // xl breakpoint
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'dropdown': '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
      },
      animation: {
        'in': 'fadeIn 0.9s ease-out',
        'slide-in-left': 'slideInLeft 0.7s ease-out 0.3s forwards',
        'slide-in-left-delay': 'slideInLeft 0.7s ease-out 0.5s forwards',
        'slide-in-right': 'slideInRight 0.7s ease-out 0.4s forwards',
        'slide-in-right-delay': 'slideInRight 0.7s ease-out 0.6s forwards',
        'scale-in': 'scaleIn 0.7s ease-out 0.35s forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    }
  },
  plugins: [],
}