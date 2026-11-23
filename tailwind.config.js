/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ['"DM Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "2xl": "calc(var(--radius) + 8px)",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "apple-sm":
          "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)",
        "apple-md":
          "0 2px 6px rgba(0, 0, 0, 0.05), 0 12px 32px -4px rgba(0, 0, 0, 0.08)",
        "apple-lg":
          "0 4px 12px rgba(0, 0, 0, 0.06), 0 24px 56px -12px rgba(0, 0, 0, 0.16)",
        "apple-dark-sm":
          "0 1px 2px rgba(0, 0, 0, 0.35), 0 6px 18px rgba(0, 0, 0, 0.28)",
        "apple-dark-md":
          "0 4px 12px rgba(0, 0, 0, 0.45), 0 18px 42px -6px rgba(0, 0, 0, 0.42)",
        "apple-dark-lg":
          "0 10px 28px rgba(0, 0, 0, 0.55), 0 32px 72px -12px rgba(0, 0, 0, 0.65)",
      },
      keyframes: {
        "dialog-overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "dialog-content-in": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -48%) scale(0.96)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.32)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "dialog-overlay-in": "dialog-overlay-in 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "dialog-content-in": "dialog-content-in 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "eq-bar-1": "eq-bar 950ms ease-in-out infinite",
        "eq-bar-2": "eq-bar 720ms ease-in-out 150ms infinite",
        "eq-bar-3": "eq-bar 840ms ease-in-out 300ms infinite",
      },
    },
  },
  plugins: [],
};
