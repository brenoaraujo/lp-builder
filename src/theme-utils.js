// ---------- theme-utils.js ----------
const hexToRgb = (hex) => {
  const h = hex.replace('#','').trim();
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToRgba = ({ r, g, b }, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

function relLuminance({r,g,b}) {
  const toLin = c => {
    const s = c/255;
    return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  };
  const R = toLin(r), G = toLin(g), B = toLin(b);
  return 0.2126*R + 0.7152*G + 0.0722*B;
}
function contrastRatio(fgHex, bgHex) {
  const L = (hex) => relLuminance(hexToRgb(hex));
  const L1 = L(fgHex), L2 = L(bgHex);
  const light = Math.max(L1, L2), dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}
export function pickTextOn(bgHex, { target = 4.5 } = {}) {
  const BLACK = "#000000";
  const WHITE = "#ffffff";
  const cBlack = contrastRatio(BLACK, bgHex);
  const cWhite = contrastRatio(WHITE, bgHex);
  if (cBlack >= target && cBlack >= cWhite) return BLACK;
  if (cWhite >= target && cWhite >= cBlack) return WHITE;
  return cBlack >= cWhite ? BLACK : WHITE;
}
export function deriveMuted({ background, foreground }) {
  const bgRgb = hexToRgb(background);
  const fgRgb = hexToRgb(foreground);
  return {
    "muted-background": rgbToRgba(bgRgb, 0.85),
    "muted-foreground": rgbToRgba(fgRgb, 0.6),
  };
}

// The only inputs users set: background/primary/secondary/alt-background per mode.
// All *-foreground are auto-derived.
export function buildThemeVars(colors = {}, mode = "light") {
  const {
    // Light
    background = "#ffffff",
    primary = "#000000",
    secondary = "#F1F5F9",
    "alt-background": altBg = "#f0f0f9",
    border = "#e4e4e7",

    // Dark
    backgroundDark = "#0b0c10",
    primaryDark = "#ffffff",
    secondaryDark = "#1e1e1f",
    "alt-background-dark": altBgDark = "#18181b",
    borderDark = "#27272a",
  } = colors;

  const isDark = mode === "dark";

  // Base picks
  const bg   = isDark ? backgroundDark : background;
  const prim = isDark ? primaryDark    : primary;
  const sec  = isDark ? secondaryDark  : secondary;
  const abg  = isDark ? altBgDark      : altBg;
  const brd  = isDark ? borderDark     : border;

  // Derive all foregrounds automatically
  const fg  = pickTextOn(bg);
  const pfg = pickTextOn(prim);
  const sfg = pickTextOn(sec);
  const afg = pickTextOn(abg);

  const auto = deriveMuted({ background: bg, foreground: fg });

  return {
    background: bg,
    foreground: fg,
    border: brd,

    primary: prim,
    "primary-foreground": pfg,

    secondary: sec,
    "secondary-foreground": sfg,

    "alt-background": abg,
    "alt-foreground": afg,

    ...auto, // muted-background / muted-foreground
  };
}