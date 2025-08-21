/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base (Theme.Colors)
        background: "var(--colors-background)",
        foreground: "var(--colors-foreground)",
        "muted-foreground": "var(--colors-muted-foreground)",
        "alt-background": "var(--colors-alt-background)",
        "alt-foreground": "var(--colors-alt-foreground)",
        primary: "var(--colors-primary)",
        "primary-foreground": "var(--colors-primary-foreground)",
        border: "var(--colors-border)",

        // Hero
        "hero-bg": "var(--hero-colors-background)",
        "hero-fg": "var(--hero-colors-foreground)",
        "hero-border": "var(--hero-colors-border)",
        "hero-primary": "var(--hero-colors-primary)",
        "hero-primary-foreground": "var(--hero-colors-primary-foreground)",
        "hero-alt-bg": "var(--hero-colors-alt-background)",
        "hero-alt-fg": "var(--hero-colors-alt-foreground)",
        "hero-secondary": "var(--hero-colors-secondary)",

        // PP
        "pp-bg": "var(--pp-colors-background)",
        "pp-fg": "var(--pp-colors-foreground)",
        "pp-border": "var(--pp-colors-border)",
        "pp-primary": "var(--pp-colors-primary)",
        "pp-primary-foreground": "var(--pp-colors-primary-foreground)",
        "pp-alt-bg": "var(--pp-colors-alt-background)",
        "pp-alt-fg": "var(--pp-colors-alt-foreground)",
        "pp-secondary": "var(--pp-colors-secondary)",

        // EB
        "eb-bg": "var(--eb-colors-background)",
        "eb-fg": "var(--eb-colors-foreground)",
        "eb-border": "var(--eb-colors-border)",
        "eb-primary": "var(--eb-colors-primary)",
        "eb-primary-foreground": "var(--eb-colors-primary-foreground)",
        "eb-alt-bg": "var(--eb-colors-alt-background)",
        "eb-alt-fg": "var(--eb-colors-alt-foreground)",
        "eb-secondary": "var(--eb-colors-secondary)",
      },
    },
  },
  plugins: [],
};