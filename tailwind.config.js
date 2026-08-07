/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0E0E12",
        "bg-surface": "#1A1A20",
        "bg-surface-alt": "#22222A",
        accent: "#F5C518",
        "accent-pressed": "#D9AE0E",
        "text-primary": "#FFFFFF",
        "text-secondary": "#9B9BA5",
        "text-on-accent": "#0E0E12",
        "text-on-accent-muted": "#412402",
        success: "#4ADE80",
        danger: "#F26D6D",
        "border-subtle": "#2A2A32",
      },
      borderRadius: { card: "16px", chip: "12px", pill: "24px" },
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
