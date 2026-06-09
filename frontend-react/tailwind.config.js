/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#040810',
          900: '#070d1a',
          800: '#0d1829',
          700: '#112038',
          600: '#162847',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease-out forwards',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.32,0.72,0,1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 12px rgba(59,130,246,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(59,130,246,0.45)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
