import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { buildThemeVars, setCSSVars, loadGoogleFont, applyFonts, readTokenDefaults, readThemeMode, resetThemeToBaseline, applyAllColors } from "../theme-utils.js";

/* Small color input row */
function ColorRole({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-20 rounded border px-2 text-xs font-mono"
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

export default function ThemeAside({ onColorsChange, onFontsChange, sectionOverrides = {}, inviteToken, inviteRow, onUpdateInvite, currentGlobalColors }) {
  // Load from database or token defaults
  const initialColors = useMemo(() => {
    if (inviteRow?.theme_json?.colors) {
      return inviteRow.theme_json.colors;
    }
    return readTokenDefaults();
  }, [inviteRow?.theme_json?.colors]);

  const [colors, setColors] = useState(initialColors);
  const lastLocalEditRef = useRef(0);
  const [fonts, setFonts] = useState(() => {
    return inviteRow?.theme_json?.fonts || {};
  });

  // Debounced save to database
  const saveTimeoutRef = useRef(null);
  const lastSavedHashRef = useRef(null);
  
  const debouncedSave = useCallback((newColors, newFonts) => {
    if (!inviteToken || !onUpdateInvite) return;
    
    // Create hash of the new theme data to check if content actually changed
    const newHash = JSON.stringify({ colors: newColors, fonts: newFonts });
    if (lastSavedHashRef.current === newHash) {
      return; // Skip save if content hasn't changed
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdateInvite({
          theme_json: {
            colors: newColors,
            fonts: newFonts
          }
        });
        lastSavedHashRef.current = newHash; // Update hash after successful save
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }, 1000); // 1 second debounce
  }, [inviteToken, onUpdateInvite]);

  useEffect(() => {
   // live preview of current font picks
   applyFonts(fonts);
 }, [fonts]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);


  // Removed direct painting; App.jsx is the single painter via applyAllColors

  // Sync pickers with the actual current global colors when globals change
  useEffect(() => {
    const external = currentGlobalColors || inviteRow?.theme_json?.colors || readTokenDefaults();
    const externalKey = JSON.stringify(external);
    const localKey = JSON.stringify(colors);
    const recentLocal = Date.now() - (lastLocalEditRef.current || 0) < 300;
    if (recentLocal) return;
    if (externalKey !== localKey) {
      setColors(external);
    }
  }, [currentGlobalColors, inviteRow?.theme_json?.colors, colors]);


  // Helpers
  const setRole = (key) => (hex) => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    // compute next based on current colors state
    let next = { ...(colors || {}), [key]: hex };
    const droppingFg = key === "background" && "foreground" in next;
    if (droppingFg) {
      const { foreground, ...rest } = next;
      next = rest;
    }
    lastLocalEditRef.current = Date.now();
    setColors(next);
    // Defer parent update to avoid updating parent during child render
    setTimeout(() => {
      onColorsChange?.(next);
      debouncedSave(next, fonts);
    }, 0);
  };
  
  function handlePickFont(token, v) {
    const picked = FONT_OPTIONS.find((f) => f.value === v);
    const next = { ...fonts, [token]: picked?.gf?.family || v };
    setFonts(next);
    onFontsChange?.(next); // parent handles loading + applyFonts
    debouncedSave(colors, next);
  }


  function handleReset() {
    resetThemeToBaseline();
    const fresh = readTokenDefaults();
    const clearedFonts = { primary: null, headline: null, numbers: null };
    setColors(fresh);
    setFonts(clearedFonts);
    onColorsChange?.(fresh);
    onFontsChange?.(clearedFonts);
    debouncedSave(fresh, clearedFonts);
  }

  return (
    <div className="space-y-4">
     

      {/* Body */}
      <div className="p-4 space-y-4">
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
          <div className="space-y-4">
            <div className="grid gap-4">
              <ColorRole key={`primary-${colors.primary}`} label="Primary" value={colors.primary} onChange={setRole("primary")} />
              <ColorRole key={`secondary-${colors.secondary}`} label="Secondary (Accent)" value={colors.secondary} onChange={setRole("secondary")} />
              <ColorRole key={`background-${colors.background}`} label="Background" value={colors.background} onChange={setRole("background")} />
              <ColorRole key={`alt-background-${colors["alt-background"]}`} label="Alternative" value={colors["alt-background"]} onChange={setRole("alt-background")} />
            </div>
          </div>
          <Button
          
          variant="outline"
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset to Defaults
        </Button>
        </div>
        

    </div>
  );
}