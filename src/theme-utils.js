/* -----------------------------------------------------------------------------
  theme-utils.js
  Single source of truth for theme colors + fonts.

  Exports used across the app:
    buildThemeVars, setCSSVars, applySavedTheme, restoreFonts,
    loadGoogleFont, applyFonts,
    readBaselineColors, readTokenDefaults, clearInlineColorVars,
    readThemeMode, resetThemeToBaseline
----------------------------------------------------------------------------- */

// ---------- small utilities ----------
const ROOT = () => document.documentElement;

const COLOR_KEYS = [
  "background",
  "foreground",
  "muted-background",
  "muted-foreground",
  "alt-background",
  "alt-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "border",
];

const STORAGE = {
  colors: "theme.colors",
  fonts: "theme.fonts",
  baseline: "theme.baseline", // optional; if present, we prefer it
};


const clamp01 = (n) => Math.min(1, Math.max(0, n));
const hex = (n) => n.toString(16).padStart(2, "0");
const toRgb = (c) => {
  const s = c.replace("#", "");
  const v = s.length === 3
    ? s.split("").map((x) => parseInt(x + x, 16))
    : [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return { r: v[0], g: v[1], b: v[2] };
};

function rgbaString(input, a = 1) {
  const rgb = typeof input === "string" ? toRgb(input) : (input || { r: 0, g: 0, b: 0 });
  const alpha = Math.max(0, Math.min(1, Number(a)));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

const toHex = ({ r, g, b }) => `#${hex(r)}${hex(g)}${hex(b)}`.toLowerCase();
const mix = (c1, c2, t) => {
  const a = toRgb(c1), b = toRgb(c2), p = clamp01(t);
  return toHex({
    r: Math.round(a.r + (b.r - a.r) * p),
    g: Math.round(a.g + (b.g - a.g) * p),
    b: Math.round(a.b + (b.b - a.b) * p)
  });
};
const luminance = (c) => {
  const { r, g, b } = toRgb(c);
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};
const isDark = (c) => luminance(c) < 0.5;
const readableOn = (bg) => (isDark(bg) ? "#ffffff" : "#111111"); // simple, fast

const normalizeHex = (c, fallback) => {
  if (typeof c !== "string") return fallback;
  const s = c.trim().toLowerCase();
  const ok = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);
  return ok ? (s.length === 4
    ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase()
    : s) : fallback;
};

// ---------- CSS var helpers ----------
export function setCSSVars(el, prefix, obj) {
  if (!el || !obj) return;
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === "") return;
    el.style.setProperty(`--${prefix}-${k}`, String(v));
  });
}

// ---------- read from computed tokens (our true defaults) ----------
function readVar(name) {
  return getComputedStyle(ROOT()).getPropertyValue(name).trim();
}

/**
 * Returns the *live* defaults coming from tokens.css / current theme.
 * This is what we treat as “factory defaults”.
 * We deliberately read only the roles the onboarding edits.
 */
export function readTokenDefaults() {
  return {
    background: readVar("--colors-background") || "#ffffff",
    foreground: readVar("--colors-foreground") || "#18181b",
    primary: readVar("--colors-primary") || "#000000",
    secondary: readVar("--colors-secondary") || "#0e85fb", // whatever tokens.css defines
    "alt-background": readVar("--colors-alt-background") || "#f0f0f9",
    border: readVar("--colors-border") || "#e4e4e7",
  };
}

/**
 * Back-compat alias (some code references this name).
 * If you later want a different baseline source, write it into
 * localStorage(theme.baseline) as a JSON string.
 */
export function readBaselineColors() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.baseline) || "null");
    if (saved && typeof saved === "object") return saved;
  } catch { }
  return readTokenDefaults();
}

/**
 * Remove ONLY the inline color overrides we may have set on :root
 * so that computed styles fall back to tokens.css again.
 */


// ---------- theme builder ----------
/**
 * Convert high-level roles to the full set of CSS variables used by tokens.css
 * `mode` can be "light" or "dark" (we just pass through here; tokens remain the same).
 */
export function buildThemeVars(input = {}, mode = "light") {
  // base inputs you actually edit
  const background = normalizeHex(input.background, mode === "dark" ? "#0a0a0a" : "#ffffff");
  const primary = normalizeHex(input.primary, mode === "dark" ? "#ffffff" : "#111111");
  const secondary = normalizeHex(input.secondary, mode === "dark" ? "#0ea5e9" : "#0e85fb");
  const altBg = normalizeHex(input["alt-background"], mode === "dark" ? "#131315" : "#f0f0f9");

  // derived tokens
  const bgDark = isDark(background);
  const foreground = normalizeHex(input.foreground, readableOn(background));
  const altForeground = readableOn(altBg);

  // adaptive muted pair (depends on background)
  const mutedBackground = bgDark
    ? mix(background, "#ffffff", 0.08) // slightly lighter than a dark bg
    : mix(background, "#000000", 0.06); // slightly darker than a light bg

  // make muted text a translucent version of the current foreground
  const mutedForeground = rgbaString(foreground, bgDark ? 0.55 : 0.50);

 


  // subtle border that also adapts with bg
  const border = bgDark ? mix(background, "#ffffff", 0.18) : mix(background, "#000000", 0.12);

  // secondary (accent) readable text
  const secondaryForeground = readableOn(secondary);
  const primaryForeground = readableOn(primary);



  return {
    // surface + text
    background,
    foreground,
    "alt-background": altBg,
    "alt-foreground": altForeground,

    // interactive colors
    primary,
    "primary-foreground": primaryForeground,
    secondary,
    "secondary-foreground": secondaryForeground,

    // UI neutrals
    border,
    "muted-background": mutedBackground,
    "muted-foreground": mutedForeground,
  };
}

/**
 * Apply saved theme (colors + fonts) to :root immediately.
 * If nothing is saved, we keep whatever tokens.css already provides.
 */
export function applySavedTheme(modeOverride) {
  const root = ROOT();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE.colors) || "{}"); } catch { }

  // If user has never saved colors, DO NOT force any color — we simply leave tokens.css in charge.
  // If they have saved colors, set the variables explicitly.
  if (saved && Object.keys(saved).length) {
    const mode =
      modeOverride ||
      (root.classList.contains("dark") || root.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light");
    const vars = buildThemeVars(saved, mode);
    setCSSVars(root, "colors", vars);
  }

  // Fonts (saved or defaults)
  restoreFonts();
}

// ---------- theme mode ----------
export function readThemeMode() {
  const el = ROOT();
  return el.getAttribute("data-theme") || (el.classList.contains("dark") ? "dark" : "light");
}

// ---------- fonts ----------
/**
 * Apply font family overrides to CSS variables consumed by tokens.css
 * Pass null/undefined to remove an override and fall back to tokens.css defaults.
 *   applyFonts({ primary: "Inter", headline: "Oswald", numbers: null })
 */
export function applyFonts(map = {}) {
  const root = ROOT();

  const setOrClear = (cssVar, val) => {
    if (!val) root.style.removeProperty(cssVar);
    else root.style.setProperty(cssVar, val);
  };

  if ("primary" in map) setOrClear("--font-primary", map.primary);
  if ("headline" in map) setOrClear("--font-headline", map.headline);
  if ("numbers" in map) setOrClear("--font-numbers", map.numbers);

  // persist
  try {
    const prev = JSON.parse(localStorage.getItem(STORAGE.fonts) || "{}");
    const next = { ...prev };
    if ("primary" in map) next.primary = map.primary || null;
    if ("headline" in map) next.headline = map.headline || null;
    if ("numbers" in map) next.numbers = map.numbers || null;
    localStorage.setItem(STORAGE.fonts, JSON.stringify(next));
  } catch { }
}

/**
 * Inject a Google Fonts stylesheet for a family/axis if not present.
 *    loadGoogleFont("Inter", "wght@400;600;700")
 */
export function loadGoogleFont(family, axis = "wght@400;700") {
  if (!family) return;
  const id = `gf:${family}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const fam = encodeURIComponent(family);
  link.href = `https://fonts.googleapis.com/css2?family=${fam}:${axis}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Re-apply saved font overrides (and inject their Google font if needed).
 */
export function restoreFonts() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE.fonts) || "{}"); } catch { }
  // Auto-load Google font for any saved family names (best-effort)
  ["primary", "headline", "numbers"].forEach((k) => {
    const fam = saved?.[k];
    if (fam) loadGoogleFont(fam);
  });
  applyFonts(saved || {});
}

// ---------- resets ----------
/**
 * Hard reset to baseline:
 * - clear stored colors/fonts
 * - clear inline CSS overrides
 * - re-apply token defaults
 */
export function resetThemeToBaseline() {
  try {
    localStorage.removeItem(STORAGE.colors);
    localStorage.removeItem(STORAGE.fonts);
  } catch { }

  // remove inline overrides so tokens.css rules win again
  clearInlineColorVars();
  ["--font-app", "--font-primary", "--font-headline", "--font-numbers"].forEach((v) =>
    ROOT().style.removeProperty(v)
  );

  // (optional) immediately re-apply current defaults so UI updates without reload
  const fresh = readTokenDefaults();
  const mode = readThemeMode();
  setCSSVars(ROOT(), "colors", buildThemeVars(fresh, mode));
}

export function clearInlineColorVars(keys = []) {
  const root = document.documentElement;
  const targets = [root, document.body];
  const prefixes = ["colors"]; // extend if you add other var namespaces
  const list = (Array.isArray(keys) && keys.length ? keys : COLOR_KEYS);

  targets.forEach((el) => {
    if (!el || !el.style) return;
    prefixes.forEach((pfx) => {
      list.forEach((k) => el.style.removeProperty(`--${pfx}-${k}`));
    });
  });
}


// --- Sharing helpers -------------------------------------------------------
// Take a concrete snapshot of the *current* theme so a viewer sees the same thing.
export function snapshotThemeNow() {
  // Prefer saved colors/fonts; if missing, read live tokens so the snapshot is explicit.
  let colors = {};
  let fonts = {};
  try { colors = JSON.parse(localStorage.getItem("theme.colors") || "{}"); } catch {}
  try { fonts  = JSON.parse(localStorage.getItem("theme.fonts")  || "{}"); } catch {}
  if (!colors || !Object.keys(colors).length) colors = readTokenDefaults();
  return { colors, fonts };
}

// Apply a theme snapshot without guessing. Optionally persist.
export function applyThemeSnapshot(snap, { persist = false } = {}) {
  const root = ROOT();
  const mode = readThemeMode();
  const colors = snap?.colors || {};
  // Only respect base input roles; derive the rest for readability
  const base = {
    background: colors.background,
    primary: colors.primary,
    secondary: colors.secondary,
    "alt-background": colors["alt-background"],
    border: colors.border,
  };
  const fonts  = snap?.fonts  || {};

  // colors
  const vars = buildThemeVars(base, mode);
  setCSSVars(root, "colors", vars);

  // fonts
  applyFonts(fonts || {}); // applyFonts already persists per-key if provided

  if (persist) {
    try { localStorage.setItem("theme.colors", JSON.stringify(base)); } catch {}
    try { localStorage.setItem("theme.fonts",  JSON.stringify(fonts));  } catch {}
  }
}

// Tiny base64 helpers used by share links (safe to duplicate if you already have them).
export function encodeState(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
export function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}