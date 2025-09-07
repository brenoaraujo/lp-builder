// src/theme-utils.js
function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const int = parseInt(h, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(bgHex, fgHex) {
  const L1 = luminance(bgHex);
  const L2 = luminance(fgHex);
  const [maxL, minL] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (maxL + 0.05) / (minL + 0.05);
}

/**
 * Return "#000000" or "#ffffff" depending on which gives better contrast
 * against bgHex. Prefers the one that reaches AA (4.5) if possible.
 */
export function pickTextOn(bgHex) {
  const black = "#000000";
  const white = "#ffffff";
  const cBlack = contrastRatio(bgHex, black);
  const cWhite = contrastRatio(bgHex, white);

  // Prefer the one that meets 4.5:1 if either does
  if (cBlack >= 4.5 && cBlack >= cWhite) return black;
  if (cWhite >= 4.5 && cWhite >= cBlack) return white;

  // Otherwise pick whichever is higher; (you could also fall back to a
  // tinted/darkened version here if you want guaranteed AA always)
  return cBlack >= cWhite ? black : white;
}