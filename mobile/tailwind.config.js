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
        background: "#F4F7FC",
        darkBlue: "#F4F7FC",
        splash: "#04112B",
        surface: "#FFFFFF",
        surfaceAlt: "#F9FAFB",
        primary: "#0A1E3F",
        primaryDark: "#07152C",
        accent: "#3B82F6",
        red: "#B91C1C",
        blue: "#3B82F6",
        green: "#10B981",
        purple: "#8B5CF6",
        yellow: "#F59E0B",
        glass: "rgba(10, 30, 63, 0.04)",
        glassHighlight: "rgba(10, 30, 63, 0.08)",
        border: "#E5E7EB",
        text: "#0A1E3F",
        textMuted: "#5F6368",
        textGray: "#5F6368",
      }
    },
  },
  plugins: [],
};
