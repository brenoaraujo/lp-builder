import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readTokenDefaults, readThemeMode, resetThemeToBaseline, applyGlobalThemeToSectionsWithoutOverrides, updateSectionsWithPartialOverrides } from "../theme-utils.js";

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

export default function ThemeAside({ open, onClose, onColorsChange, onFontsChange, sectionOverrides = {} }) {
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

  useEffect(() => {
   if (!open) return;
   // live preview of current font picks
   applyFonts(fonts);
 }, [open, fonts]);

  useEffect(() => {
    const handleSectionSelected = () => {
      onClose?.(); // close the aside
    };
    // listen for our custom event
    window.addEventListener("lp:section-selected", handleSectionSelected);
    return () => window.removeEventListener("lp:section-selected", handleSectionSelected);
  }, [onClose]);

  // Live preview while open
  useEffect(() => {
    if (!open) return;
    const mode = readThemeMode();
    const vars = buildThemeVars(colors, mode);
    setCSSVars(document.documentElement, "colors", vars);
    setCSSVars(document.body, "colors", vars);
    
    // Apply global theme to sections without overrides
    applyGlobalThemeToSectionsWithoutOverrides(colors, sectionOverrides);
  }, [open, colors, sectionOverrides]);

  // Update sections with partial overrides when colors change (but not when modal opens)
  const [previousColors, setPreviousColors] = useState(null);
  useEffect(() => {
    if (!open) return;
    
    // Only update when colors actually change, not when modal opens
    if (previousColors && JSON.stringify(previousColors) !== JSON.stringify(colors)) {
      updateSectionsWithPartialOverrides(colors, sectionOverrides);
    }
    setPreviousColors(colors);
  }, [colors, sectionOverrides, open, previousColors]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Helpers
  const setRole = (key) => (hex) => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    setColors((prev) => {
      let next = { ...prev, [key]: hex };
    if (key === "background" && "foreground" in next) {
      // let buildThemeVars pick a readable foreground for the new bg
      const { foreground, ...rest } = next;
      next = rest;
    }
    onColorsChange?.(next);
    return next;
      
    });
  };
  function handlePickFont(token, v) {
    const picked = FONT_OPTIONS.find((f) => f.value === v);
    const next = { ...fonts, [token]: picked?.gf?.family || v };
    setFonts(next);
    onFontsChange?.(next); // parent handles loading + applyFonts + persist
  }


  function handleReset() {
    resetThemeToBaseline();
    const fresh = readTokenDefaults();
    setColors(fresh);
    onColorsChange?.(fresh);
    onFontsChange?.({ primary: null, headline: null, numbers: null }); // clears overrides

  }

  function handleCancel() {
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
          {/* Typography -- DON'T REMOVE THIS FEATURE 
          <div className="space-y-3">
            <div className="text-sm font-semibold">Typography</div>
            <div className="grid gap-4">
              
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
          </div>*/}

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

          <Button variant="outline" onClick={handleReset}>Reset to defauts</Button>
          {/*<Button variant="ghost" onClick={handleCancel}>Cancel</Button>*/}
        </div>
      </div>
    </aside>
  );
}