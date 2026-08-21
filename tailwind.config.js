/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#162a5a",
        "on-primary": "#ffffff",
        "primary-container": "#2e4172",
        "on-primary-container": "#9caee7",
        "primary-fixed": "#dae2ff",
        "on-primary-fixed": "#001848",
        
        "secondary": "#974730",
        "on-secondary": "#ffffff",
        "secondary-container": "#fe987c",
        "on-secondary-container": "#772e1a",
        "secondary-fixed": "#ffdbd1",
        
        "tertiary": "#3a2b00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#554000",
        "on-tertiary-container": "#cfac55",
        "tertiary-fixed": "#ffdf96",
        
        "surface": "#f8f9fa",
        "on-surface": "#191c1d",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-variant": "#e1e3e4",
        "on-surface-variant": "#44464f",
        
        "background": "#f8f9fa",
        "on-background": "#191c1d",
        "outline": "#757780",
        "outline-variant": "#c5c6d0",
        "surface-tint": "#4a5d90",
        
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a"
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif']
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px'
      },
      boxShadow: {
        'ambient-card': '0 4px 12px rgba(22, 42, 90, 0.04), 0 2px 4px rgba(22, 42, 90, 0.02)',
        'ambient-bottom': '0 -8px 24px rgba(22, 42, 90, 0.06)',
        'ambient-elevated': '0 12px 32px rgba(22, 42, 90, 0.08)'
      }
    },
  },
  plugins: [],
}
