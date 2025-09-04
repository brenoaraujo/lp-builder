// === color utils (paste once) ===============================================
function clamp01(x){ return Math.min(1, Math.max(0, x)); }

function hexToRgb(hex) {
  let s = hex.replace('#','').trim();
  if (s.length === 3) s = s.split('').map(c => c+c).join('');
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex({r,g,b}){
  const to = v => v.toString(16).padStart(2,'0');
  return '#' + to(r) + to(g) + to(b);
}
function mix(aHex, bHex, t=0.5) {
  const a = hexToRgb(aHex), b = hexToRgb(bHex);
  const lerp = (x,y)=> Math.round(x+(y-x)*t);
  return rgbToHex({ r: lerp(a.r,b.r), g: lerp(a.g,b.g), b: lerp(a.b,b.b) });
}
function relativeLuminance(hex) {
  const {r,g,b} = hexToRgb(hex);
  const lin = (c)=> {
    const cs = c/255;
    return cs <= 0.03928 ? cs/12.92 : Math.pow((cs+0.055)/1.055, 2.4);
  };
  const R = lin(r), G = lin(g), B = lin(b);
  return 0.2126*R + 0.7152*G + 0.0722*B;
}
function contrastRatio(hexA, hexB) {
  const L1 = relativeLuminance(hexA);
  const L2 = relativeLuminance(hexB);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function pickTextOn(bg, light="#ffffff", dark="#111111") {
  // Choose the one with higher contrast against bg
  const crLight = contrastRatio(bg, light);
  const crDark  = contrastRatio(bg, dark);
  // If neither reaches 4.5:1, still pick the best (simple, robust)
  return crLight >= crDark ? light : dark;
}
// Soft tints/shades for "muted" / borders
function tint(hex, t=0.92){ return mix(hex, "#ffffff", t); }  // closer to white
function shade(hex, t=0.16){ return mix(hex, "#000000", t); } // closer to black
// ============================================================================

// Build the full theme your components already expect from 3–4 core swatches
function computeThemeFromCore({
  primary   = "#000000",
  secondary = "#e4e4e7",
  accent    = "#6366f1",   // optional "alternative" / highlight
  background= "#ffffff",
}) {
  const foreground = pickTextOn(background);
  const border = mix(foreground, background, 0.85);     // subtle gray
  const mutedBg = mix(background, foreground, 0.08);    // light gray on light bg
  const mutedFg = mix(foreground, background, 0.45);    // mid gray

  const altBackground  = tint(accent, 0.90);            // very light accent wash
  const altForeground  = pickTextOn(altBackground);

  return {
    // keep EXACT keys used across your app / sections
    background,
    foreground,
    "muted-background": mutedBg,
    "muted-foreground": mutedFg,
    "alt-background": altBackground,
    "alt-foreground": altForeground,
    primary,
    "primary-foreground": pickTextOn(primary),
    border,
    secondary,
    "secondary-foreground": pickTextOn(secondary),
    // (bonus: expose accent if you want to use it later)
    accent,
    "accent-foreground": pickTextOn(accent),
  };
}