import type { Config } from "tailwindcss";

export default {
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
        forest: {
          50: "#F2F7F4",
          100: "#E1EDE6",
          200: "#C3DCCE",
          300: "#9EC5B0",
          400: "#6EA689",
          500: "#468866",
          600: "#2E6D4E",
          700: "#23563E",
          800: "#1B4332", // Primary Forest Green
          900: "#133124", // Deepest Forest
          950: "#0B1D15",
        },
        ivory: {
          50: "#FCFBF7", // Primary Warm Off-white canvas
          100: "#F7F4EC", // Elevated card / section background
          200: "#EDE7DB", // Subtle border
          300: "#DFD6C3", // Strong border
          400: "#C8BCA4",
          500: "#ADA086",
          600: "#8B7F68",
          700: "#6B614E",
          800: "#4D4638",
          900: "#2E2A22",
        },
        earth: {
          50: "#FBF5F2",
          100: "#F7EAE3",
          200: "#EFCFC2",
          300: "#E4B09B",
          400: "#D78E72",
          500: "#C46B44", // Terracotta accent
          600: "#A9522D",
          700: "#863D1F",
          800: "#632D17",
          900: "#442011",
        },
        amber: {
          500: "#D97706",
          600: "#B45309",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(19, 49, 36, 0.05), 0 1px 2px -1px rgba(19, 49, 36, 0.05)",
        card: "0 4px 6px -1px rgba(19, 49, 36, 0.06), 0 2px 4px -2px rgba(19, 49, 36, 0.06)",
        elevated: "0 10px 15px -3px rgba(19, 49, 36, 0.08), 0 4px 6px -4px rgba(19, 49, 36, 0.04)",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
