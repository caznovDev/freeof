/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#0f0f0f",
        darknav: "#181818",
        accent: "#3b82f6",
        card: "#111827",
        borderPink: "#ff007f"
      }
    }
  },
  plugins: []
};
