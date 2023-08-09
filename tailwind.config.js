const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/forms'), require('@headlessui/tailwindcss')],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    extend: {
      spacing: {
        114: '30.5rem',
      },
      colors: {
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        'kelly-green': '#43B200',
        crayola: '#FFB524',
        'vivid-cerulean': '#00A3FF',
        'deep-carmine-pink': '#EA3838',
        'davy-grey ': '#5A5A5A',
        'approved-green': '#CCEABA',
        'papaya-whip': '#FFF0D4',
        water: '#CBECFF',
        'light-red': '#FFD3D3',
        platinum: '#E0E7EA',
        'azureish-white': '#D5DCED',
        'deep-koamaru': '#2E3357',
        'pastel-purple': '#A99FB3',
        soap: '#D0D4EB',
        rhythm: '#787BA0',
        'anti-flash-white': '#F1F3F8',
        'eerie-black': '#111827',
        'auro-metal-saurus': '#6B7280',
        'ghost-white': '#F9FAFB',
        'bright-gray': '#E5E7EB',
        lavander: '#EAE4FF',
        'violets-are-blue': '#9379FB',
        'light-gray': '#EAEAEA',
        'almost-white': '#F1F1F1',
        'pink-lace': '#FFE3FC',
        'purple-pizzazz': '#FF3EEC',
        'international-orange': '#C31515',
        'gamboge-orange': '#976400',
        'heliotrope-magenta': '#C200AF',
      },
      boxShadow: {
        allDirections: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05), 0px 0px 0px 1px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translate3d(0,100%,0)' },
          '100%': { opacity: 1, transform: 'translate3d(0,0,0)' },
        },
        fadeInRight: {
          '0%': { opacity: 0, transform: 'translate3d(100%,0,0)' },
          '100%': { opacity: 1, transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 1s ease-in-out',
        fadeInRight: 'fadeInRight 1s ease-in-out',
      },
    },
  },
}
