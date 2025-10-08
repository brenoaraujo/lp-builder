// src/components/ThemePanel.jsx
// Side panel to edit Fonts & Colors (shadcn/ui).
// Responsibilities: read/save localStorage, apply CSS vars live, hard-reset to token defaults.

import React, { useMemo, useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  buildThemeVars,
  setCSSVars,
  loadGoogleFont,
  applyFonts,
  readTokenDefaults,
  clearInlineColorVars,       // <-- add this in theme-utils (code below)
} from "../theme-utils.js";

// Small color input
function ColorRole({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-28 rounded-md border px-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}

// Font list shown in the Selects
const FONT_OPTIONS = [
  { label: "Inter",        value: "Inter",        gf: { family: "Inter",        axis: "wght@400;600;700" } },
  { label: "Montserrat",   value: "Montserrat",   gf: { family: "Montserrat",   axis: "wght@400;600" } },
  { label: "Poppins",      value: "Poppins",      gf: { family: "Poppins",      axis: "wght@400;600" } },
  { label: "Roboto",       value: "Roboto",       gf: { family: "Roboto",       axis: "wght@400;700" } },
  { label: "Oswald",       value: "Oswald",       gf: { family: "Oswald",       axis: "wght@400;700" } },
];

const COLOR_KEYS = ["background", "primary", "secondary", "alt-background", "border"];

export default function ThemePanel({ open, onOpenChange }) {
  // 1) Colors state — re-sync from storage/tokens every time panel opens
  const [colors, setColors] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("theme.colors") || "{}");
      return Object.keys(saved).length ? saved : readTokenDefaults();
    } catch {
      return readTokenDefaults();
    }
  });

  useEffect(() => {
    if (!open) return;
    // Refresh snapshot when user re-opens the panel so UI matches current app state
    try {
      const saved = JSON.parse(localStorage.getItem("theme.colors") || "{}");
      setColors(Object.keys(saved).length ? saved : readTokenDefaults());
    } catch {
      setColors(readTokenDefaults());
    }
  }, [open]);

  const setRole = (key) => (hex) => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    setColors((c) => ({ ...c, [key]: hex }));
  };

  // 2) Fonts snapshot (names only)
  const [fonts, setFonts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("theme.fonts") || "{}"); }
    catch { return {}; }
  });

  // Live preview while panel is open
  useEffect(() => {
    if (!open) return;
    const vars = buildThemeVars(colors, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
  }, [open, colors]);

  function handlePickFont(token, v) {
    const picked = FONT_OPTIONS.find((f) => f.value === v);
    if (picked?.gf) loadGoogleFont(picked.gf.family, picked.gf.axis);
    const chosen = picked?.gf?.family || v;     // we don’t offer "system" here
    const next = { ...fonts, [token]: chosen };
    setFonts(next);
    applyFonts(next);                           // writes localStorage("theme.fonts") + sets CSS vars
  }

  function saveAndClose() {
    try { localStorage.setItem("theme.colors", JSON.stringify(colors)); } catch {}
    const vars = buildThemeVars(colors, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
    onOpenChange?.(false);
  }

  // ✅ Hard reset: purge storage and inline CSS vars, then re-apply pure tokens.css values
  function resetToDefaults() {
    try {
      localStorage.removeItem("theme.colors");
      // (Optional) If you also want to wipe fonts, uncomment the next line:
      // localStorage.removeItem("theme.fonts");
    } catch {}

    // remove any inline color overrides (so tokens.css can actually win)
    clearInlineColorVars(COLOR_KEYS);

    // read fresh values coming straight from tokens.css
    const fresh = readTokenDefaults();
    setColors(fresh);

    // apply to :root and body so the preview flips immediately
    const vars = buildThemeVars(fresh, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Fonts & Colors</SheetTitle>
        </SheetHeader>

        <div className="space-y-8 py-4">
          {/* Typography */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Typography</div>
            <div className="grid grid-cols-1 gap-4">
              {/* Body */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Body</div>
                <Select onValueChange={(v) => handlePickFont("primary", v)}>
                  <SelectTrigger className="rounded-2xl border px-4 py-3">
                    <SelectValue placeholder={(fonts.primary || "Inter").toUpperCase()} />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Heading */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Heading</div>
                <Select onValueChange={(v) => handlePickFont("headline", v)}>
                  <SelectTrigger className="rounded-2xl border px-4 py-3">
                    <SelectValue placeholder={(fonts.headline || "Inter").toUpperCase()} />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Numbers */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Numbers</div>
                <Select onValueChange={(v) => handlePickFont("numbers", v)}>
                  <SelectTrigger className="rounded-2xl border px-4 py-3">
                    <SelectValue placeholder={(fonts.numbers || "Merriweather").toUpperCase()} />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Colors</div>
            <div className="grid gap-5">
              <ColorRole label="Primary"     value={colors.primary}            onChange={setRole("primary")} />
              <ColorRole label="Secondary"   value={colors.secondary}          onChange={setRole("secondary")} />
              <ColorRole label="Background"  value={colors.background}         onChange={setRole("background")} />
              <ColorRole label="Alternative" value={colors["alt-background"]}  onChange={setRole("alt-background")} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveAndClose}>Save</Button>
            <Button variant="outline" onClick={resetToDefaults}>Reset</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}