import type { Config } from "tailwindcss";

/**
 * Upstream design tokens.
 *
 * The product's core emotion is calm vigilance: "nothing is wrong, and you
 * know it." The palette is a control room at rest — deep ink surfaces, a
 * phosphor signal-green for all-clear, amber for deprecations on the horizon,
 * red reserved exclusively for confirmed breakage. Red is never decorative.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#06080D", // page background (dark)
          900: "#0B0E15", // raised surface
          800: "#12161F", // card surface
          700: "#1A202C", // hover surface
          600: "#242B3A", // active surface
        },
        line: {
          DEFAULT: "#1D2330", // hairline borders on ink
          strong: "#2C3548",
        },
        signal: {
          DEFAULT: "#2EE6A8", // all-clear, primary action
          dim: "#1B8A67",
          faint: "rgba(46, 230, 168, 0.08)",
        },
        ember: {
          DEFAULT: "#F5B84B", // deprecation / approaching deadline
          faint: "rgba(245, 184, 75, 0.10)",
        },
        breach: {
          DEFAULT: "#FF5D5D", // confirmed breaking change / incident
          faint: "rgba(255, 93, 93, 0.10)",
        },
        pulse: {
          DEFAULT: "#6AA6FF", // informational
          faint: "rgba(106, 166, 255, 0.10)",
        },
        fg: {
          DEFAULT: "#E8EDF4", // primary text on ink
          muted: "#8A94A6",
          faint: "#5A6376",
        },
        paper: "#F7F8F9", // light-mode background
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      transitionTimingFunction: {
        // A needle settling into place: fast attack, long decay.
        needle: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "700": "700ms",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scanline: "scanline 6s linear infinite",
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        "rise-in": "rise-in 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
