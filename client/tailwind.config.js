/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      mobile320: '320px',
      mobile375: '375px',
      mobile425: '425px',
      tablet768: '768px',
      tablet1024: '1024px',
      desktop1440: '1440px',
      wide2560: '2560px',
      xs: '380px',
      sm: '600px',
      md: '850px',
      lg: '1100px',
      xl: '1280px',
    },
    extend: {
      colors: { kitty: { coral: '#ed8a68', moss: '#728b77', cream: '#fffaf4' } },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
      fontSize: {
        body: 'var(--font-body)',
        supporting: 'var(--font-supporting)',
        label: 'var(--font-label)',
        caption: 'var(--font-caption)',
        product: 'var(--font-product)',
      },
    },
  },
  plugins: [],
}
