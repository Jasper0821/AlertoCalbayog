/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        darkBlue: "#0A0A0B",
        surface: "#161B22",
        primary: "#FF5C00", // Vibrant Orange from theme
        accent: "#FF8A00",
        red: "#EF4444",
        blue: "#0EA5E9",
        green: "#10B981",
        glass: "rgba(255, 255, 255, 0.05)",
        glassHighlight: "rgba(255, 255, 255, 0.1)",
        border: "rgba(255, 255, 255, 0.1)",
        textGray: "#9CA3AF",
      }
    },
  },
  plugins: [],
};
