/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Path to your React components
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  // Optional: DaisyUI configuration
  daisyui: {
    themes: ["light", "dark", "cupcake"], // You can specify themes here
    darkTheme: "dark", // Default dark theme
    base: true, // Applies base styles
    styled: true, // Applies DaisyUI component styles
    utils: true, // Adds DaisyUI utility classes
    rtl: false, // Right-to-left support
    prefix: "", // Prefix for DaisyUI classes (e.g., "dui-")
    logs: true, // Show logs in the console
  },
}
