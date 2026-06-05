/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cat: {
          bg: '#FFF8E7',
          secondary: '#FFF3D0',
          accent: '#FFB347',
          'accent-light': '#FFD699',
          card: '#FFFDF5',
          text: '#5D4E37',
          'text-light': '#8B7E6A',
          income: '#7BC67E',
          expense: '#E87272',
          border: '#F0E6D0',
        },
      },
      boxShadow: {
        cat: '0 2px 12px rgba(245, 166, 35, 0.1)',
        'cat-md': '0 4px 20px rgba(245, 166, 35, 0.15)',
        'cat-lg': '0 8px 30px rgba(245, 166, 35, 0.18)',
      },
      borderRadius: {
        cat: '16px',
        'cat-sm': '10px',
        'cat-lg': '24px',
      },
    },
  },
  plugins: [],
}
