import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        line: "var(--line)",
      },
      maxWidth: {
        prose: "44rem",
      },
    },
  },
  plugins: [],
};

export default config;
