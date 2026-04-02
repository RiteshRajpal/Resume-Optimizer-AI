/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#060810",
          50: "rgba(255, 255, 255, 0.025)",
          100: "rgba(255, 255, 255, 0.05)",
          200: "#0d1117",
          300: "#161b22",
          400: "#1e293b",
        },
        accent: {
          DEFAULT: "#14b8a6",
          light: "#5eead4",
          dark: "#0d9488",
          cyan: "#06b6d4",
          glow: "rgba(20, 184, 166, 0.4)",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          hover: "rgba(255, 255, 255, 0.12)",
          accent: "rgba(20, 184, 166, 0.3)",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "fade-in-delay": "fadeIn 0.6s ease-out 0.2s forwards",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite alternate",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(20, 184, 166, 0.15)" },
          "100%": {
            boxShadow:
              "0 0 40px rgba(20, 184, 166, 0.3), 0 0 80px rgba(6, 182, 212, 0.1)",
          },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(20, 184, 166, 0.2)",
        "glow-md": "0 0 30px -5px rgba(20, 184, 166, 0.3)",
        "glow-lg": "0 0 50px -10px rgba(20, 184, 166, 0.4)",
      },
    },
  },
  plugins: [],
};
