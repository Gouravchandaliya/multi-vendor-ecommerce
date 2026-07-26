/** @type {import('tailwindcss').Config} */
export default {
  // content tells Tailwind which files to scan for class names.
  // Only classes found here are included in the final CSS bundle.
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom design tokens will go here in later phases
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
