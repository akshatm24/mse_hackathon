import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#F59E0B",
          dim: "#B45309",
          subtle: "#1C1917",
          border: "#292524"
        },
        surface: {
          950: "#09090B",
          900: "#18181B",
          800: "#27272A",
          700: "#3F3F46",
          600: "#52525B",
          400: "#A1A1AA",
          200: "#E4E4E7"
        },
        score: {
          high: "#F59E0B",
          mid: "#38BDF8",
          low: "#34D399"
        },
        property: {
          thermal: "#F59E0B",
          weight: "#38BDF8",
          strength: "#34D399",
          cost: "#A78BFA",
          corrosion: "#FB7185"
        },
        status: {
          best: "#34D399",
          worst: "#FB7185"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245, 158, 11, 0.12), 0 24px 80px rgba(0, 0, 0, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
