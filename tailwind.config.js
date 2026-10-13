/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rice: { 50: 'rgb(var(--color-rice-50) / <alpha-value>)', 100: 'rgb(var(--color-rice-100) / <alpha-value>)', 200: 'rgb(var(--color-rice-200) / <alpha-value>)' },
        chili: { 50: 'rgb(var(--color-chili-50) / <alpha-value>)', 100: 'rgb(var(--color-chili-100) / <alpha-value>)', 500: 'rgb(var(--color-chili-500) / <alpha-value>)', 600: 'rgb(var(--color-chili-600) / <alpha-value>)', 700: 'rgb(var(--color-chili-700) / <alpha-value>)' },
        amber: { 100: 'rgb(var(--color-amber-100) / <alpha-value>)', 400: 'rgb(var(--color-amber-400) / <alpha-value>)', 500: 'rgb(var(--color-amber-500) / <alpha-value>)' },
        charcoal: { 500: 'rgb(var(--color-charcoal-500) / <alpha-value>)', 700: 'rgb(var(--color-charcoal-700) / <alpha-value>)', 900: 'rgb(var(--color-charcoal-900) / <alpha-value>)' },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      fontFamily: { sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'] },
      keyframes: { rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } },
      animation: { rise: 'rise .35s ease-out both' },
    },
  },
  plugins: [],
}
