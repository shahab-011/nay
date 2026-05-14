/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand ─────────────────────────────── */
        "primary":          "#7C3AED",
        "primary-hover":    "#6D28D9",
        "primary-deep":     "#5B21B6",
        "primary-soft":     "#F0EAFC",
        "primary-mist":     "#E4D9F9",
        "primary-glow":     "rgba(124,58,237,0.18)",

        /* ── Surfaces ──────────────────────────── */
        "bg":               "#F6F4F8",
        "bg-tint":          "#EDE7F4",
        "surface":          "#FFFFFF",
        "elevated":         "#FBFAFC",
        "active-bg":        "#F1ECF7",
        "border-col":       "#E8E4EE",
        "border-active":    "#D5CCE5",

        /* ── Ink / Text ────────────────────────── */
        "ink":              "#0B0B14",
        "ink-soft":         "#1A1A28",
        "on-surface":       "#0B0B14",
        "on-surface-variant": "#5A5A6E",
        "on-surface-muted": "#8A8A9E",

        /* ── Status ────────────────────────────── */
        "success":          "#16A36A",
        "success-bg":       "rgba(22,163,106,0.10)",
        "warning":          "#D97706",
        "warning-bg":       "rgba(217,119,6,0.10)",
        "error":            "#DC2660",
        "error-bg":         "rgba(220,38,96,0.10)",
        "info":             "#2563EB",
        "info-bg":          "rgba(37,99,235,0.08)",
        "gold":             "#D97706",
        "gold-bg":          "rgba(217,119,6,0.10)",

        /* Legacy aliases (keep existing pages working during migration) */
        "background":       "#F6F4F8",
        "secondary":        "#A78BFA",
        "on-primary":       "#FFFFFF",
        "on-background":    "#0B0B14",
      },
      borderRadius: {
        "DEFAULT":  "10px",
        "md":       "16px",
        "lg":       "22px",
        "xl":       "22px",
        "full":     "9999px",
      },
      fontFamily: {
        "headline": ["'Bricolage Grotesque'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "body":     ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "mono":     ["'JetBrains Mono'", "ui-monospace", "monospace"],
        "label":    ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card":   "0 1px 2px rgba(11,11,20,0.04), 0 8px 24px rgba(11,11,20,0.06)",
        "float":  "0 12px 48px rgba(11,11,20,0.10)",
        "pill":   "0 2px 8px rgba(11,11,20,0.06)",
        "purple": "0 8px 24px rgba(124,58,237,0.22)",
      },
    },
  },
  plugins: [],
}
