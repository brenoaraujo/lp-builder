// src/theme-utils.js

const clamp = (n, min=0, max=255) => Math.min(max, Math.max(min, n));
const hexToRgb = (hex) => {
  const h = hex.replace('#','').trim();
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToRgba = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

export const pickTextOn = (bg) => (luma(bg) > 0.5 ? "#000000" : "#ffffff");

const luma = (hex) => {
  const { r,g,b } = hexToRgb(hex);
  const [R,G,B] = [r,g,b].map(c => {
    const x = c/255;
    return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
  });
  return 0.2126*R + 0.7152*G + 0.0722*B;
};

/** derive muted-* as semi-transparent versions */
export function deriveMuted({ background, foreground }) {
  const bgRgb = hexToRgb(background);
  const fgRgb = hexToRgb(foreground);

  return {
    "muted-background": rgbToRgba(bgRgb, 0.85),   // 85% solid bg
    "muted-foreground": rgbToRgba(fgRgb, 0.6),   // 75% solid fg
  };
}

export function buildThemeVars(colors = {}, mode = "light") {
  const {
    background = "#ffffff",
    foreground = "#18181b",
    primary = "#000000",
    "primary-foreground": primaryFg = pickTextOn(primary),
    secondary = "#e4e4e7",
    "secondary-foreground": secondaryFg = pickTextOn(secondary),
    "alt-background": altBg = "#f0f0f9",
    "alt-foreground": altFg = pickTextOn(altBg),
    border = "#e4e4e7",

    backgroundDark = "#0b0c10",
    foregroundDark = "#e5e7eb",
    borderDark = "#27272a",
  } = colors;

  const isDark = mode === "dark";
  const bg = isDark ? backgroundDark : background;
  const fg = isDark ? foregroundDark : foreground;
  const brd = isDark ? borderDark : border;

  const auto = deriveMuted({ background: bg, foreground: fg });

  return {
    background: bg,
    foreground: fg,
    border: brd,
    primary,
    "primary-foreground": primaryFg,
    secondary,
    "secondary-foreground": secondaryFg,
    "alt-background": altBg,
    "alt-foreground": altFg,
    ...auto, // "muted-background", "muted-foreground" as rgba()
  };
}