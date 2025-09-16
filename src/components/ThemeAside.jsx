import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readTokenDefaults } from "../theme-utils.js";

/* Small color input row */
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

/* Curated fonts */
const FONT_OPTIONS = [
  { label: "Inter", value: "Inter", gf: { family: "Inter", axis: "wght@400;600;700" } },
  { label: "Montserrat", value: "Montserrat", gf: { family: "Montserrat", axis: "wght@400;600" } },
  { label: "Poppins", value: "Poppins", gf: { family: "Poppins", axis: "wght@400;600" } },
  { label: "Roboto", value: "Roboto", gf: { family: "Roboto", axis: "wght@400;700" } },
  { label: "Oswald", value: "Oswald", gf: { family: "Oswald", axis: "wght@400;700" } },
];

export default function ThemeAside({ open, onClose }) {
  // Load saved or token defaults
  const initialColors = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("theme.colors") || "{}");
      return Object.keys(saved).length ? saved : readTokenDefaults();
    } catch {
      return readTokenDefaults();
    }
  }, []);

  const [colors, setColors] = useState(initialColors);
  const [fonts, setFonts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("theme.fonts") || "{}"); } catch { return {}; }
  });

  // When panel opens, snapshot the currently-saved colors to support "Cancel"
  const savedColorsRef = useRef(initialColors);
  useEffect(() => {
    if (!open) return;
    try {
      const saved = JSON.parse(localStorage.getItem("theme.colors") || "{}");
      const current = Object.keys(saved).length ? saved : readTokenDefaults();
      savedColorsRef.current = current;
      setColors(current);
      // live preview on open to make sure UI matches
      const vars = buildThemeVars(current, "light");
      setCSSVars(document.documentElement, "colors", vars);
      setCSSVars(document.body, "colors", vars);
    } catch {}
  }, [open]);

  // Live preview while open
  useEffect(() => {
    if (!open) return;
    const vars = buildThemeVars(colors, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
  }, [open, colors]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        // revert to last-saved on cancel
        const back = savedColorsRef.current;
        const vars = buildThemeVars(back, "light");
        setColors(back);
        setCSSVars(document.documentElement, "colors", vars);
        setCSSVars(document.body, "colors", vars);
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Helpers
  const setRole = (key) => (hex) => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return; // guard invalid hex
    setColors((c) => ({ ...c, [key]: hex }));
  };

  function handlePickFont(token, v) {
    const picked = FONT_OPTIONS.find((f) => f.value === v);
    if (picked?.gf) loadGoogleFont(picked.gf.family, picked.gf.axis);
    const next = { ...fonts, [token]: picked?.gf?.family || v };
    setFonts(next);
    applyFonts(next); // writes localStorage + sets --font-* vars
  }

  function handleSave() {
    try { localStorage.setItem("theme.colors", JSON.stringify(colors)); } catch {}
    const vars = buildThemeVars(colors, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
    savedColorsRef.current = colors; // update snapshot
    onClose?.();
  }

  function handleReset() {
    try { localStorage.removeItem("theme.colors"); } catch {}
    const fresh = readTokenDefaults();
    setColors(fresh);
    const vars = buildThemeVars(fresh, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
  }

  function handleCancel() {
    const back = savedColorsRef.current;
    setColors(back);
    const vars = buildThemeVars(back, "light");
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
    onClose?.();
  }

  if (!open) return null;

  return (
    <aside
      className="fixed left-2 top-18 z-50 w-[320px] sm:w-[360px] overflow-hidden rounded-md border bg-white shadow-lg"
      role="dialog"
      aria-label="Fonts & Colors"
    >
      <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="text-md font-semibold text-gray-700">Design</div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-auto p-4 space-y-8">
          {/* Typography */}
          <div className="space-y-3">
            <div className="text-sm font-semibold">Typography</div>
            <div className="grid gap-4">
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
              <ColorRole label="Primary" value={colors.primary} onChange={setRole("primary")} />
              <ColorRole label="Secondary (Accent)" value={colors.secondary} onChange={setRole("secondary")} />
              <ColorRole label="Background" value={colors.background} onChange={setRole("background")} />
              <ColorRole label="Alternative" value={colors["alt-background"]} onChange={setRole("alt-background")} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t bg-slate-50 p-3 flex flex-col gap-2">
          <Button className="flex-1" onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          {/*<Button variant="ghost" onClick={handleCancel}>Cancel</Button>*/}
        </div>
      </div>
    </aside>
  );
}