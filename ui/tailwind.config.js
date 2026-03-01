/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07090f",
          900: "#0B0F19",
          800: "#0f1520",
          700: "#151d2e",
          600: "#1c2640",
          500: "#243050",
        },
        cyan: {
          DEFAULT: "#00E5FF",
          dim: "#00b8cc",
          glow: "rgba(0,229,255,0.15)",
          trace: "rgba(0,229,255,0.06)",
        },
        violet: {
          DEFAULT: "#7C3AED",
          soft: "#a855f7",
          trace: "rgba(124,58,237,0.12)",
        },
        danger: "#FF4D6A",
        warn: "#FFAA00",
        muted: "rgba(255,255,255,0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.01em",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "orb-breathe": "orb-breathe 2.5s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "cursor-blink": "cursor-blink 1.1s step-end infinite",
        "scan-line": "scan-line 3s linear infinite",
        "border-glow": "border-glow 2s ease-in-out infinite",
        dots: "dots 1.4s steps(3,end) infinite",
      },
      keyframes: {
        "orb-breathe": {
          "0%,100%": { boxShadow: "0 0 6px 2px rgba(0,229,255,0.4)" },
          "50%": { boxShadow: "0 0 18px 6px rgba(0,229,255,0.7)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "cursor-blink": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(400%)" },
        },
        "border-glow": {
          "0%,100%": { borderColor: "rgba(0,229,255,0.2)" },
          "50%": { borderColor: "rgba(0,229,255,0.6)" },
        },
        dots: {
          "0%": { content: "'.'" },
          "33%": { content: "'..'" },
          "66%": { content: "'...'" },
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0,229,255,0.25), 0 0 60px rgba(0,229,255,0.08)",
        "glow-violet": "0 0 20px rgba(124,58,237,0.25), 0 0 60px rgba(124,58,237,0.08)",
        "glow-danger": "0 0 20px rgba(255,77,106,0.25), 0 0 60px rgba(255,77,106,0.08)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
