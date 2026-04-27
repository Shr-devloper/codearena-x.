/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        void: {
          950: "#05070d",
          900: "#0B0F1A",
          850: "#0f1422",
          800: "#131a2b",
          700: "#1a2235",
        },
        accent: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          indigo: "#6366f1",
          pink: "#f472b6",
        },
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(99, 102, 241, 0.45)",
        "glow-sm": "0 0 24px -6px rgba(99, 102, 241, 0.35)",
        innerGlow: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        mesh: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, transparent 50%), linear-gradient(225deg, rgba(34,211,238,0.08) 0%, transparent 45%)",
      },
      animation: {
        pulseSlow: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
