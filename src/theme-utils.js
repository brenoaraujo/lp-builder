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

/**
 * Get the appropriate image variant (light/dark) based on background color
 * @param {string} baseImagePath - The base image path (should end with -light.png, -light.svg, etc.)
 * @param {string} backgroundColor - The background color to determine variant
 * @returns {string} - The full image path with appropriate variant
 */
export function getImageVariant(baseImagePath, backgroundColor) {
  if (!backgroundColor) return baseImagePath;
  
  const isDarkBg = isDark(backgroundColor);
  const variant = isDarkBg ? 'dark' : 'light';
  
  // Replace the variant in the path - support both PNG and SVG
  return baseImagePath.replace(/-light\.(png|svg|jpg|jpeg|webp)$/i, `-${variant}.$1`);
}

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

// Set CSS variables with !important for section overrides
export function setCSSVarsImportant(el, prefix, obj) {
  if (!el || !obj) return;
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === "") return;
    el.style.setProperty(`--${prefix}-${k}`, String(v), 'important');
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

  // debug removed

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
 * Deterministic resolver: derive the effective base color inputs for a section
 * following the precedence: App Defaults < Global Theme < Section Override.
 * If background is overridden without foreground, we drop foreground to allow
 * buildThemeVars() to regenerate an accessible color.
 */
export function resolvePalette(defaults = {}, globalColors = {}, overrideValues = null, opts = {}) {
  const base = { ...(defaults || {}), ...(globalColors || {}) };
  // Global path: if background was explicitly changed at global level but foreground was not,
  // drop foreground so buildThemeVars can recompute accessible foreground.
  const globalBgChangedNoFg = !!(globalColors && Object.prototype.hasOwnProperty.call(globalColors, "background") && !Object.prototype.hasOwnProperty.call(globalColors, "foreground"));
  if (globalBgChangedNoFg && Object.prototype.hasOwnProperty.call(base, "foreground")) {
    delete base.foreground;
  }
  if (!overrideValues || typeof overrideValues !== "object" || !Object.keys(overrideValues).length) {
    if (opts?.trace) return { colors: base, traceByKey: Object.fromEntries(Object.keys(base).map(k => [k, "global"])) };
    return base;
  }
  const merged = { ...base, ...overrideValues };
  const droppedForeground = !!(overrideValues.background && !overrideValues.foreground && Object.prototype.hasOwnProperty.call(merged, "foreground"));
  if (droppedForeground) delete merged.foreground;

  if (opts?.trace) {
    const traceByKey = {};
    Object.keys(merged).forEach((k) => {
      if (k in overrideValues) traceByKey[k] = "section";
      else if (k in (globalColors || {})) traceByKey[k] = "global";
      else traceByKey[k] = "default";
    });
    return { colors: merged, traceByKey };
  }
  return merged;
}

/** Resolve palettes for all sections using a shared overrides object. */
export function resolveAllPalettes(defaults = {}, globalColors = {}, overridesBySection = {}) {
  const result = {};
  const keys = Object.keys(overridesBySection || {});
  keys.forEach((sectionKey) => {
    const ov = overridesBySection[sectionKey]?.theme?.values || {};
    result[sectionKey] = resolvePalette(defaults, globalColors, ov);
  });
  return result;
}

/**
 * Apply saved theme (colors + fonts) to :root immediately.
 * If nothing is saved, we keep whatever tokens.css already provides.
 */
export function applySavedTheme(modeOverride) {
  const root = ROOT();
  const mode =
    modeOverride ||
    (root.classList.contains("dark") || root.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light");
  // Keep whatever tokens.css provides; no LS colors here.
  // Re-apply any current inline fonts (no-op without DB-provided fonts)
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

  // no LocalStorage persistence; DB is source of truth
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
  // No LS-backed restore; fonts are applied from DB by caller when present
}

// ---------- resets ----------
/**
 * Hard reset to baseline:
 * - clear stored colors/fonts
 * - clear inline CSS overrides
 * - re-apply token defaults
 */
export function resetThemeToBaseline() {
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
  const colors = readTokenDefaults();
  // Fonts snapshot reads live CSS vars; avoid LS
  const fonts = {
    primary: getComputedStyle(ROOT()).getPropertyValue("--font-primary").trim() || null,
    headline: getComputedStyle(ROOT()).getPropertyValue("--font-headline").trim() || null,
    numbers: getComputedStyle(ROOT()).getPropertyValue("--font-numbers").trim() || null,
  };
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
  // No LS persistence for colors/fonts here
}

// Tiny base64 helpers used by share links (safe to duplicate if you already have them).
export function encodeState(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
export function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}

// ---------- section color overrides ----------

/**
 * Remove section-specific color overrides from a section element
 */
export function clearSectionColorOverrides(sectionElement) {
  if (!sectionElement) return;
  
  // Clear all color CSS variables from the section element
  const colorKeys = [
    "background", "foreground", "primary", "primary-foreground",
    "secondary", "secondary-foreground", "alt-background", "alt-foreground",
    "border", "muted", "muted-foreground", "accent", "accent-foreground",
    "destructive", "destructive-foreground", "success", "success-foreground",
    "warning", "warning-foreground"
  ];
  
  colorKeys.forEach(key => {
    sectionElement.style.removeProperty(`--colors-${key}`);
  });
}


/**
 * SINGLE SOURCE OF TRUTH for applying all colors
 * Call this whenever colors change (global or section)
 */
export function applyAllColors(globalColors, sectionOverrides = {}) {
  const mode = readThemeMode();

  // Resolve root palette from defaults + global (no section override)
  const defaults = readTokenDefaults();
  const traceEnabled = (() => {
    try { return window && (window.__THEME_TRACE__ || /[?&]traceTheme=1/.test(location.search)); } catch { return false; }
  })();
  const rootBase = resolvePalette(defaults, globalColors);
  const rootVars = buildThemeVars(rootBase, mode);
  // debug removed
  setCSSVars(document.documentElement, "colors", rootVars);

  // Apply per-section effective palettes
  const sectionElements = document.querySelectorAll('[data-section]');
  sectionElements.forEach((sectionElement) => {
    const sectionType = sectionElement.getAttribute('data-section');

    // Map feature to first extraContent override if present (builder convention)
    let overrideDef = sectionOverrides[sectionType];
    if (!overrideDef && sectionType === 'feature') {
      const extraContentKeys = Object.keys(sectionOverrides).filter((k) => k.startsWith('extraContent_'));
      if (extraContentKeys.length > 0) overrideDef = sectionOverrides[extraContentKeys[0]];
    }

    const overrideValues = overrideDef?.theme?.enabled ? (overrideDef?.theme?.values || {}) : {};
    const effectiveBase = resolvePalette(defaults, globalColors, overrideValues);
    const vars = buildThemeVars(effectiveBase, mode);
    setCSSVarsImportant(sectionElement, "colors", vars);

    // debug removed
  });
}