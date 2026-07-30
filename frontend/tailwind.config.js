import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          team: "#3b82f6",
          dark: "#1e3a5f",
          light: "#93c5fd",
        },
        red: {
          team: "#ef4444",
          dark: "#5f1e1e",
          light: "#fca5a5",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
