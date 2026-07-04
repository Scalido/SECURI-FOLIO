import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#10B981", // Neon Emerald (validation/success)
          secondary: "#047857", // Deep Emerald
          accent: "#F59E0B", // Subtle Gold
          bg: "#0B0F19", // Deep Black/Slate Grey
          surface: "#111827", // Card backgrounds
          border: "#1F2937", // Luminous borders
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
