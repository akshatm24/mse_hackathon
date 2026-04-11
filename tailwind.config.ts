import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          400: "#fbbf24",
          500: "#f59e0b"
        },
        zinc: {
          950: "#09090b"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245, 158, 11, 0.18), 0 18px 60px rgba(245, 158, 11, 0.12)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseDot: {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-dot": "pulseDot 1s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
