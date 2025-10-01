// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

// Sections
import { HeroA, HeroB } from "./sections/Hero.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "./sections/Winners.jsx";
import { FeatureA, FeatureB } from "./sections/Feature.jsx";
import { WhoYouHelpA, WhoYouHelpB } from "./sections/WhoYouHelp.jsx";
import { NavbarA, NavbarB } from "./sections/Navbar.jsx";
import { FooterA, FooterB } from "./sections/Footer.jsx";

// Onboarding
import OnboardingWizard from "./onboarding/OnboardingWizard.jsx";

import EditorForOnboarding from "./onboarding/EditorForOnboarding.jsx";
import { SECTIONS } from "./sections/registry.js";
import EditorSidebar from "./components/EditorSidebar.jsx";
import { useBuilderOverrides } from "./context/BuilderOverridesContext.jsx";

// Theme + utilities
import { applySavedTheme, applyThemeSnapshot, restoreFonts, buildThemeVars, readBaselineColors, clearInlineColorVars, readTokenDefaults, readThemeMode, loadGoogleFont, applyFonts, setCSSVarsImportant } from "./theme-utils.js"
import { snapshotThemeNow } from "./theme-utils.js";
import ThemeAside from "@/components/ThemeAside.jsx";


// UI/UX libs
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import { X, Plus, ChevronDown, ArrowRight, Pencil, GripVertical, Paintbrush } from "lucide-react";
import SectionActionsMenu from "./components/SectionActionsMenu";
import { toast } from "sonner";

// Robust imports for AutoScaler + EditableSection
import * as AutoScalerMod from "@/components/AutoScaler";
import * as EditableSectionMod from "@/components/EditableSection";

import { SECTION_ORDER } from "./onboarding/sectionCatalog.jsx";





const AutoScaler =
  AutoScalerMod.default ??
  AutoScalerMod.AutoScaler ??
  (({ children }) => <div className="w-full">{children}</div>);

const EditableSection =
  EditableSectionMod.default ??
  EditableSectionMod.EditableSection ??
  (({ children }) => <>{children}</>);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Unique id
const uid = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now();

// Keep only control keys that are still discoverable
const pruneControls = (controls = {}, partsList) => {
  const arr = Array.isArray(partsList)
    ? partsList
    : partsList && typeof partsList === "object"
      ? Object.values(partsList)
      : [];
  const allow = new Set(arr.map((p) => p?.id).filter(Boolean));
  return Object.fromEntries(Object.entries(controls || {}).filter(([k]) => allow.has(k)));
};

// Build a stable id from a label
const slugify = (s = "") =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Normalize copy parts to ensure every item has an id
const normalizeCopyParts = (list) => {
  const arr = Array.isArray(list) ? list : list && typeof list === "object" ? Object.values(list) : [];
  return arr
    .map((p) => {
      const id = p.id ?? p.copyId ?? p.key ?? slugify(p.label);
      return id ? { ...p, id } : null;
    })
    .filter(Boolean);
};

// Keep only copy keys that are still discoverable
const pruneCopy = (copyValues = {}, copyParts = []) => {
  const normalized = normalizeCopyParts(copyParts);
  const allow = new Set(normalized.map((p) => p.id));
  return Object.fromEntries(Object.entries(copyValues).filter(([k]) => allow.has(k)));
};

// Set CSS vars on an element
const setCSSVars = (el, prefix, obj) => {
  if (!el || !obj) return;
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === "") return;
    el.style.setProperty(`--${prefix}-${k}`, String(v));
  });
};

// Safe URL state encoding/decoding
function encodeState(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeState(s) {
  try {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const json = decodeURIComponent(escape(atob(s)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// share only base theme roles (derived ones are recomputed on load)
const BASE_COLOR_KEYS = ["background", "primary", "secondary", "alt-background", "border"];
const onlyBaseColors = (obj = {}) =>
  Object.fromEntries(BASE_COLOR_KEYS.map(k => [k, obj[k]]).filter(([, v]) => !!v));

// Email handoff
const PRODUCTION_EMAIL = "baraujo@ascendfs.com";
function buildApprovalMailto(to, { company, project, approverName, approverEmail, notes, url }) {
  const subject = `[APPROVED] ${company} — ${project}`;
  const lines = [
    `Company: ${company}`,
    `Project: ${project}`,
    `Approver: ${approverName} <${approverEmail}>`,
    notes ? `Notes: ${notes}` : null,
    "",
    "Snapshot URL:",
    url,
  ].filter(Boolean);

  const body = lines.join("\n");
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function packSnapshot({ blocks, globalTheme }) {
  // pull the in-use theme & fonts from localStorage so the share matches exactly
  let savedColors = {};
  let savedFonts = {};
  try { savedColors = JSON.parse(localStorage.getItem("theme.colors") || "{}"); } catch { }
  try { savedFonts = JSON.parse(localStorage.getItem("theme.fonts") || "{}"); } catch { }

  // include builder overrides so the preview matches
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem("builderOverrides") || "{}"); } catch { }

  return {
    blocks,
    globalTheme: { colors: onlyBaseColors(globalTheme?.colors || {}) },
    theme: { colors: savedColors, fonts: savedFonts },
    overrides,
    meta: { v: 1 } // version for future-proofing
  };
}


function unpackSnapshot(obj) {
  if (!obj || typeof obj !== "object") return { blocks: [], globalTheme: {} };
  const {
    blocks = [],
    globalTheme = {},
    theme = {},
    overrides = {},
  } = obj;
  return { blocks, globalTheme, theme, overrides };
}

// Simple hash-route hook
function useHashRoute() {
  const get = () => location.hash.replace(/^#/, "");
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const onHash = () => setRoute(get());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route || "/";
}




/* ------------------------------------------------------------------ */
/* Theme controls                                                     */
/* ------------------------------------------------------------------ */

function ThemePopover({ globalTheme, setGlobalTheme }) {
  const colors = globalTheme?.colors ?? {};
  const order = [
    "background",
    "primary",
    "secondary",
    "alt-background",

  ];
  const set = (key, val) =>
    setGlobalTheme((t) => ({ ...t, colors: { ...(t.colors || {}), [key]: val } }));

  const Row = ({ label, keyName }) => (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type="color"
        value={colors?.[keyName] ?? "#000000"}
        onChange={(e) => set(keyName, e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border"
        aria-label={label}
      />
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-gray-500">Theme Colors</Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80 p-3">
        <div className="space-y-3 text-sm">
          <div className="font-semibold">Global Colors</div>
          {order.filter(k => k in colors).map((keyName) => (
            <Row key={keyName} label={keyName.replace(/-/g, " ")} keyName={keyName} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SectionThemePopover({
  type,
  overrides = {},
  onSetOverrides,
  availableKeys = [],
  title = "Enable Color Overrides",
  readOnly = true,
}) {
  const enabled = !!overrides.enabled;
  const values = overrides.values || {};
  const valuesPP = overrides.valuesPP || {};

  const setEnabled = (v) => !readOnly && onSetOverrides({ ...overrides, enabled: !!v });
  const setValMain = (key, val) => !readOnly && onSetOverrides({
    ...overrides, enabled: true, values: { ...(overrides.values || {}), [key]: val },
  });
  const setValPP = (key, val) => !readOnly && onSetOverrides({
    ...overrides, enabled: true, valuesPP: { ...(overrides.valuesPP || {}), [key]: val },
  });

  const Row = ({ label, keyName, value, onChange }) => (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type="color"
        disabled={!enabled || readOnly}
        value={value ?? "#000000"}
        onChange={(e) => onChange(keyName, e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border disabled:opacity-50"
        aria-label={label}
      />
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-grey-700" disabled={readOnly}>
          Custom Colors <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="bottom" align="end" sideOffset={8}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{title}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={readOnly} />
        </div>

        <div className="space-y-3">
          {availableKeys.map((keyName) => (
            <Row
              key={`main-${keyName}`}
              label={keyName.replace(/-/g, " ")}
              keyName={keyName}
              value={values?.[keyName]}
              onChange={setValMain}
            />
          ))}
        </div>

        {type === "hero" && (
          <>
            <Separator className="my-3" />
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500">Price Points in Hero</div>
              {availableKeys.map((keyName) => (
                <Row
                  key={`pp-${keyName}`}
                  label={keyName.replace(/-/g, " ")}
                  keyName={keyName}
                  value={valuesPP?.[keyName]}
                  onChange={setValPP}
                />
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Variant chooser (dock dialog)                                      */
/* ------------------------------------------------------------------ */

function VariantDock({ open, type, currentVariant, onPick, onClose }) {
  const entry = SECTIONS[type];
  if (!entry) return null;

  const { variants, labels } = entry;
  const safeIndex = Math.min(Math.max(0, currentVariant ?? 0), variants.length - 1);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="fixed right-4 top-24 z-[2147483647] w-80 max-h-[75vh] p-0 overflow-hidden rounded-2xl border bg-white shadow-xl"
        showClose={false}
      >
        <DialogHeader className="px-3 py-2">
          <DialogTitle className="text-sm font-semibold">Choose {entry.label} Variant</DialogTitle>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[calc(75vh-5rem)] p-3">
          <div className="space-y-3">
            {variants.map((VariantComp, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => onPick(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
                className={[
                  "w-full overflow-hidden rounded-xl border bg-white text-left outline-none transition",
                  i === safeIndex ? "ring-2 ring-blue-500" : "hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="px-3 pt-2 text-xs font-medium text-gray-700">
                  {labels?.[i] ?? `Variant ${i + 1}`}
                </div>
                <div className="p-2">
                  <AutoScaler designWidth={1440} targetWidth={300} maxHeight={520}>
                    <VariantComp preview />
                  </AutoScaler>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-2 flex justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Sortable Block (canvas item)                                       */
/* ------------------------------------------------------------------ */

function SortableBlock({
  id, type, variant, controls, copyValues, parts,
  onPartsDiscovered, onCopyDiscovered, onTogglePart, onCopyChange,
  onRemove, onVariantPick, overrides, onSetOverrides,
  availableThemeKeys = [], readOnly = false,
  onSelect, selected, variantOpen, onVariantOpenChange, contentOpen, onContentOpenChange,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef, // may be undefined on older dnd-kit, that's fine
    transform,
    transition
  } = useSortable({ id, disabled: readOnly });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // For dynamic extra content sections, use the feature section definition
  let entry;
  if (type.startsWith('extraContent_')) {
    entry = SECTIONS.feature || null;
  } else {
    entry = SECTIONS[type];
  }
  if (!entry) return null;

  const variants = entry.variants || [];
  const labels = entry.labels || entry.variantLabels || [];
  const safeIndex = Math.min(Math.max(0, Number.isInteger(variant) ? variant : 0), Math.max(0, variants.length - 1));
  const Comp = variants[safeIndex] || (() => <div className="rounded border p-4 text-sm">Missing variant</div>);
  const contentRef = useRef(null);
  const contentWidth = useElementWidth(contentRef);
  const targetWidth = Math.max(320, Math.min(1440, contentWidth || 0));
  const [copyParts, setCopyParts] = useState([]);

  const listParts = Array.isArray(parts) ? parts : parts && typeof parts === "object" ? Object.values(parts) : [];

  // Apply section color overrides using the same approach as ThemeAside
  useEffect(() => {
    if (!overrides?.enabled || !overrides.values) return;
    
    // For extraContent sections, use "feature" as the data-section attribute
    const sectionType = type.startsWith('extraContent_') ? 'feature' : type;
    const sectionElement = document.querySelector(`[data-section="${sectionType}"]`);
    if (!sectionElement) return;

    // Get current global theme colors
    const globalColors = readTokenDefaults();
    const mode = readThemeMode();
    
    // Merge global colors with overrides (only the changed colors)
    const mergedColors = {
      ...globalColors,
      ...overrides.values
    };
    
    // Build theme variables with proper foreground calculation
    const themeVars = buildThemeVars(mergedColors, mode);
    
    // Apply with !important to override global theme
    setCSSVarsImportant(sectionElement, "colors", themeVars);
    
    // Cleanup function to remove overrides when component unmounts
    return () => {
      // Remove the !important overrides to fall back to global theme
      Object.keys(themeVars).forEach(key => {
        sectionElement.style.removeProperty(`--colors-${key}`);
      });
    };
  }, [overrides, type]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "relative bg-white  transition overflow-visible",
        selected ? "z-10 outline outline-2 outline-blue-500 ring-0"
          : "hover:z-20 hover:outline hover:outline-2 hover:outline-blue-500",
      ].join(" ")}
    >
      {/* Drag handle */}
      {!readOnly && (
        <button
          type="button"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          ref={setActivatorNodeRef}         // activator handle for dnd-kit
          {...attributes}
          {...listeners}
          className={[
            "absolute -right-10 top-3 z-20 grid h-7 w-7 place-items-center",
            "rounded-md border bg-slate-100 text-slate-600",
            "hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-500 focus:text-white ",
            // hidden by default, visible when block is hovered or selected
            "opacity-0 group-hover:opacity-100",
            selected ? "opacity-100" : "",
            "transition-opacity cursor-grab active:cursor-grabbing"
          ].join(" ")}    // <-- join with a space!
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Canvas content */}
      <div
        ref={contentRef}
        onClick={(e) => { e.stopPropagation(); onSelect?.(id); window.dispatchEvent(new Event("lp:section-selected")); }}
      >
        <AutoScaler designWidth={1440} targetWidth={targetWidth} maxHeight={9999}>
          <div data-scope={type}>
            <EditableSection
              discoverKey={`${id}:${type}:${safeIndex}`}
              controls={controls}
              copyValues={copyValues}
              onPartsDiscovered={(found) => onPartsDiscovered?.(id, found)}
              onCopyDiscovered={(found) => {
                const arr = Array.isArray(found) ? found : found && typeof found === "object" ? Object.values(found) : [];
                setCopyParts(arr);
                onCopyDiscovered?.(arr);
              }}
            >
              <Comp />
            </EditableSection>
          </div>
        </AutoScaler>
      </div>

      {/* Content popover (Display + Copy) */}
      <Popover open={!!contentOpen} onOpenChange={onContentOpenChange}>
        <PopoverTrigger asChild>
          <button type="button" aria-hidden="true" tabIndex={-1} className="absolute right-3 top-3 h-1 w-1 opacity-0" />
        </PopoverTrigger>
        <PopoverContent
          side="right" align="end" sideOffset={12}
          className="z-[9999] w-80 p-0 rounded-2xl shadow-lg bg-white"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2">
            <div className="text-sm font-semibold">Customize Section</div>
            <div className="text-xs text-gray-500">Show / hide optional elements in this section</div>
          </div>
          <Separator />
          <ScrollArea className="max-h-[60vh] p-3">
            {/* Display toggles */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2">Optional Sections</div>
              <div className="space-y-2">
                {listParts.length === 0 ? (
                  <div className="text-xs text-gray-500">No editable parts found in this section.</div>
                ) : (
                  listParts.map((p) => {
                    const current = controls[p.id];
                    const checked = current !== undefined ? current : p.visible;
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => !readOnly && onTogglePart(p.id, !checked)}
                        onKeyDown={(e) => !readOnly && (e.key === "Enter" || e.key === " ") && onTogglePart(p.id, !checked)}
                        className={[
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                          readOnly ? "opacity-60" : "hover:bg-gray-50 cursor-pointer",
                        ].join(" ")}
                      >
                        <span className="truncate">{p.label}</span>
                        <Switch
                          checked={checked}
                          onCheckedChange={(v) => !readOnly && onTogglePart(p.id, v)}
                          className="h-4 w-7"
                          disabled={readOnly}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Copy edits */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 mb-2">Copy</div>
              {copyParts.length === 0 ? (
                <div className="text-xs text-gray-500">No copy-editable parts in this section.</div>
              ) : (
                copyParts.map((p) => {
                  const current =
                    copyValues && typeof copyValues[p.id] === "string" ? copyValues[p.id] : p.defaultText;
                  const max = p.maxChars || 120;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-gray-600">{p.label}</label>
                        <div className="text-right text-[11px] text-gray-400">{current?.length ?? 0}/{max}</div>
                      </div>
                      <input
                        type="text"
                        value={current}
                        maxLength={max}
                        onChange={(e) => !readOnly && onCopyChange(p.id, e.target.value)}
                        className="w-full rounded-md border p-2 text-sm outline focus:outline-2 focus:outline-blue-500"
                        placeholder={`Up to ${max} characters`}
                        readOnly={readOnly}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Persisted onboarding storage key
const OVERRIDES_KEY = "lpb.overrides";

function blocksFromOverrides(ovr = {}) {
  const out = [];
  const push = (type, variantKey, sect) => {
    const variant = variantKey === "B" ? 1 : 0;
    out.push({
      id: crypto?.randomUUID?.() ?? `${type}_${Date.now()}`,
      type,
      variant,
      controls: sect?.display || {},
      copy: sect?.copy || {},
      overrides: sect?.theme || { enabled: false, values: {}, valuesPP: {} },
    });
  };

  if (ovr.hero?.visible !== false) push("hero", ovr.hero?.variant || "A", ovr.hero);
  if (ovr.extraPrizes?.visible !== false) push("extraPrizes", ovr.extraPrizes?.variant || "A", ovr.extraPrizes);
  if (ovr.winners?.visible !== false) push("winners", ovr.winners?.variant || "A", ovr.winners);
  
  // Handle dynamic extra content sections
  Object.keys(ovr).forEach(key => {
    if (key.startsWith('extraContent_') && ovr[key]?.visible !== false) {
      push(key, ovr[key]?.variant || "A", ovr[key]);
    }
  });
  
  if (ovr.WhoYouHelp?.visible !== false) push("WhoYouHelp", ovr.WhoYouHelp?.variant || "A", ovr.WhoYouHelp);
  return out.length ? out : [{
    id: crypto?.randomUUID?.() ?? `hero_${Date.now()}`,
    type: "hero", variant: 0, controls: {}, copy: {},
    overrides: { enabled: false, values: {}, valuesPP: {} },
  }];
}


/* ------------------------------------------------------------------ */
/* Main App (builder + onboarding route)                              */
/* ------------------------------------------------------------------ */

export function MainBuilder() {
  const { overridesBySection, setSection } = useBuilderOverrides();

  const HAS_SNAPSHOT = useMemo(() => {
    const raw = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    return !!raw && !raw.startsWith("/");
  }, []);

  // [ADD] Single source of truth to hydrate theme on load (colors + fonts)
  useEffect(() => {
    const raw = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    const isRouteHash = raw.startsWith("/"); // "#/...", "#/onboarding", etc.

    // 1) If URL hash carries a snapshot (NOT a route), hydrate from it
    if (!isRouteHash && raw.length > 0) {
      const loaded = decodeState(raw); // your own helper below in this file
      if (loaded && typeof loaded === "object") {
        // Newer snapshots may include full theme (colors + fonts)
        if (loaded.theme && (loaded.theme.colors || loaded.theme.fonts)) {
          applyThemeSnapshot(loaded.theme, { persist: true }); // apply + save
        } else if (loaded.globalTheme?.colors) {
          // Back-compat: legacy snapshots with only colors
          const { ["muted-background"]: _mb, ["muted-foreground"]: _mf, ...rest } =
            loaded.globalTheme.colors || {};
          try { localStorage.setItem("theme.colors", JSON.stringify(rest)); } catch { }
          const mode = readThemeMode();
          setCSSVars(document.documentElement, "colors", buildThemeVars(rest, mode));
        }
        // Fonts from legacy snapshots are handled by applySavedTheme() below if they were saved earlier
      }

      // Mark onboarding as done when opening share links
      try { localStorage.setItem("onboardingCompleted", "1"); } catch { }

    } else {
      // 2) No snapshot → apply whatever is saved (colors + fonts) in one call
      applySavedTheme(); // reads theme.colors + theme.fonts and applies both
    }

    // 3) Keep other tabs/windows in sync
    const onStorage = (e) => {
      if (e.key === "theme.colors" || e.key === "theme.fonts") {
        applySavedTheme();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [HAS_SNAPSHOT]);


  useEffect(() => {
    const done = localStorage.getItem("onboardingCompleted") === "1";
    const hash = window.location.hash.replace(/^#/, "");
    // If user finished onboarding, never sit on the onboarding route
    if (done && hash.startsWith("/onboarding")) {
      window.location.hash = "/";
    }
  }, []);

  function blocksFromOverrides(ovr) {
    const order = ["hero", "extraPrizes", "winners", "WhoYouHelp"]; // keep this consistent with your app
    const toIndex = (v) => (v === "B" ? 1 : 0);       // "A" → 0, "B" → 1

    const blocks = [];
    
    // First, add sections in the standard order
    order.forEach((k) => {
      if (ovr?.[k]?.visible !== false) {
        const s = ovr[k] || {};
        blocks.push({
          id: crypto?.randomUUID?.() ?? `b_${k}_${Date.now()}`,
          type: k,
          variant: toIndex(s.variant || "A"),
          controls: s.display || {},
          copy: s.copy || {},
          overrides: s.theme || { enabled: false, values: {}, valuesPP: {} },
        });
      }
    });
    
    // Then, add all extra content sections
    Object.keys(ovr).forEach((k) => {
      if (k.startsWith('extraContent_') && ovr[k]?.visible !== false) {
        const s = ovr[k] || {};
        blocks.push({
          id: crypto?.randomUUID?.() ?? `b_${k}_${Date.now()}`,
          type: k,
          variant: toIndex(s.variant || "A"),
          controls: s.display || {},
          copy: s.copy || {},
          overrides: s.theme || { enabled: false, values: {}, valuesPP: {} },
        });
      }
    });
    
    return blocks;
  }


  // Auto-open onboarding the first time
  useEffect(() => {
    const done = localStorage.getItem("onboardingCompleted") === "1";
    const wantsWizard = new URLSearchParams(window.location.search).get("wizard") === "1";

    if (!done || wantsWizard) {
      if (location.hash !== "#/onboarding") location.hash = "/onboarding";
    } else if (location.hash === "#/onboarding") {
      // if user already finished and hits a stale wizard hash, kick them to builder
      location.hash = "/";
    }
  }, []);

  const [themeOpen, setThemeOpen] = useState(false);

  // Builder state
  const [hydrated, setHydrated] = useState(false);
  const didAutoSelectOnce = useRef(false);

  const [blocks, setBlocks] = useState([
    { id: uid(), type: "hero", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } },
  ]);

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [variantForId, setVariantForId] = useState(null);
  const [contentForId, setContentForId] = useState(null);
  const [picker, setPicker] = useState({ open: false, index: null });

  function closePanel() {
    setActiveBlockId(null);
    setVariantForId(null);
    setContentForId(null);
  }
  useEffect(() => { if (activeBlockId == null) { setVariantForId(null); setContentForId(null); } }, [activeBlockId]);
  {/* if you want the first block selected on the first
  useEffect(() => {
    if (!didAutoSelectOnce.current && !activeBlockId && blocks.length) {
      setActiveBlockId(blocks[0].id);
      didAutoSelectOnce.current = true;
    }
  }, [activeBlockId, blocks]);*/}




  const [partsByBlock, setPartsByBlock] = useState({});
  const [copyPartsByBlock, setCopyPartsByBlock] = useState({});

  // Fixed sections (Navbar/Footer) state for controls/copy
  const [navbarControls, setNavbarControls] = useState({});
  const [navbarCopy, setNavbarCopy] = useState({});
  const [footerControls, setFooterControls] = useState({});
  const [footerCopy, setFooterCopy] = useState({});

  const [globalTheme, setGlobalTheme] = useState({
    colors: {
      background: "#ffffff",
      foreground: "#18181b",
      "alt-background": "#f0f0f9",
      "alt-foreground": "#000000",
      primary: "#000000",
      "primary-foreground": "#ffffff",
      border: "#e4e4e7",
      secondary: "#F1F5F9",
      "secondary-foreground": "#71717a",
    },
  });

  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("lpb.theme.mode") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Start with system preference and keep CSS vars in sync (✅ single place now)

  useEffect(() => {
    // Always set the DOM attribute so readThemeMode() is reliable
    document.documentElement.setAttribute("data-theme", themeMode);

    // Only paint inline colors from state if there are NO saved colors yet.
    if (!localStorage.getItem("theme.colors")) {
      const vars = buildThemeVars(globalTheme.colors, themeMode);
      setCSSVars(document.documentElement, "colors", vars);
    }
  }, [globalTheme, themeMode]);

  const persistColors = useCallback((partialColors) => {
    // merge with current
    const next = { ...(globalTheme?.colors || {}), ...(partialColors || {}) };

    // write CSS vars now
    const mode = readThemeMode?.() || "light";
    const vars = buildThemeVars(next, mode);
    setCSSVars(document.documentElement, "colors", vars);

    // persist so refresh picks it up
    try { localStorage.setItem("theme.colors", JSON.stringify(next)); } catch { }

    // keep React state in sync (defer to avoid setState during render)
    setTimeout(() => {
      setGlobalTheme((t) => ({ ...(t || {}), colors: next }));
    }, 0);
  }, [globalTheme]);

  const persistFonts = useCallback((map) => {
    // optional: best-effort auto-load any webfont
    ["primary", "headline", "numbers"].forEach((k) => {
      const fam = map?.[k];
      if (fam) loadGoogleFont(fam);
    });

    // applies + persists per key under theme.fonts
    applyFonts(map || {});
  }, []);

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffDefaults, setHandoffDefaults] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lpb.approver.defaults");
      if (saved) setHandoffDefaults(JSON.parse(saved));
    } catch { }
  }, []);

  const submitHandoff = (formData) => {
    try {
      const payload = encodeState(blocks);
      location.hash = payload;
      history.replaceState(null, "", `#${payload}`);
    } catch { }
    const url = location.href;
    const mailto = buildApprovalMailto(PRODUCTION_EMAIL, { ...formData, url });
    try { window.location.href = mailto; }
    catch { navigator.clipboard?.writeText(`${formData.company} / ${formData.project}\n${url}`); }
    setHandoffOpen(false);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("theme.colors") || "{}");
      if (Object.keys(saved).length) {
        // merge into state (so ThemePanel sees them)
        setGlobalTheme(t => ({ ...t, colors: { ...(t.colors || {}), ...saved } }));
        // and write the CSS vars immediately
        const mode =
          document.documentElement.classList.contains("dark") ||
            document.documentElement.getAttribute("data-theme") === "dark"
            ? "dark"
            : "light";
        setCSSVars(document.documentElement, "colors", buildThemeVars(saved, mode));
      }
    } catch { }
  }, []);

  const [approvedMeta, setApprovedMeta] = useState(null);
  const approvedMode = !!approvedMeta?.approved;

  // DnD sensors + reorder
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event) => {
    if (approvedMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    setBlocks((arr) => arrayMove(arr, oldIndex, newIndex));
  };

  // Hydrate from URL hash (supports old & new snapshots)

  // listem os theme preference
  // Hydrate theme mode (respect saved pref; otherwise fall back to OS)
  useEffect(() => {
    const stored = localStorage.getItem("lpb.theme.mode");
    if (stored === "light" || stored === "dark") {
      setThemeMode(stored);
      return; // don't attach OS listener if user chose explicitly
    }

    // No stored pref → use OS and keep it in sync
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    setThemeMode(mq?.matches ? "dark" : "light");
    const onChange = (e) => setThemeMode(e.matches ? "dark" : "light");
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  // Persist user preference when it changes
  useEffect(() => {
    try { localStorage.setItem("lpb.theme.mode", themeMode); } catch { }
  }, [themeMode]);


  useEffect(() => {
    const rawHash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    const isRouteHash = rawHash.startsWith("/"); // "#/", "#/onboarding", etc.

    // 1) If the hash is a snapshot (NOT a route), hydrate from it first
    if (!isRouteHash && rawHash.length > 0) {
      const loaded = decodeState(rawHash);
      if (!loaded) { setHydrated(true); return; }

      if (Array.isArray(loaded)) {
        setBlocks(loaded.map((b) => ({
          id: b.id, type: b.type, variant: Number.isInteger(b.variant) ? b.variant : 0,
          controls: b.controls || {}, copy: b.copy || {},
          overrides: b.overrides || { enabled: false, values: {}, valuesPP: {} },
        })));
      } else if (loaded && typeof loaded === "object") {
        if (Array.isArray(loaded.blocks)) {
          setBlocks(loaded.blocks.map((b) => ({
            id: b.id, type: b.type, variant: Number.isInteger(b.variant) ? b.variant : 0,
            controls: b.controls || {}, copy: b.copy || {},
            overrides: b.overrides || { enabled: false, values: {}, valuesPP: {} },
          })));
        }
        // If the snapshot contains theme colors, persist + apply them immediately
        if (loaded.globalTheme?.colors) {
          // keep all roles you use, just ignore the auto-muted pair
          const { ["muted-background"]: _mb, ["muted-foreground"]: _mf, ...rest } =
            loaded.globalTheme.colors || {};
          setGlobalTheme({ colors: rest });
          try { localStorage.setItem("theme.colors", JSON.stringify(rest)); } catch { }
          // Make the preview use the shared colors right away (includes 'foreground')
          const mode = readThemeMode?.() || "light";
          // Clear any stale inline vars so we don't keep an old foreground/border
          clearInlineColorVars();
          setCSSVars(document.documentElement, "colors", buildThemeVars(rest, mode));
        }
        if (loaded.theme && (loaded.theme.colors || loaded.theme.fonts)) {
          applyThemeSnapshot(loaded.theme, { persist: true });
        }
        if (loaded.meta?.approved) setApprovedMeta({ ...loaded.meta });
      }
      // visiting a share link should not trigger onboarding
      try { localStorage.setItem("onboardingCompleted", "1"); } catch { }
      setHydrated(true);
      return;
    }

    // 2) Otherwise (no snapshot / just a route), hydrate from onboarding overrides if present
    try {
      const raw = localStorage.getItem("builderOverrides");
      if (raw) {
        const ovr = JSON.parse(raw);
        const nextBlocks = blocksFromOverrides(ovr);
        if (nextBlocks.length > 0) setBlocks(nextBlocks);
      }
    } catch { }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || approvedMode) return;
    const payload = encodeState(packSnapshot({ blocks, globalTheme }));
    history.replaceState(null, "", `#${payload}`);
  }, [blocks, globalTheme, hydrated, approvedMode]);


  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  // Share, reset, approve
  const [toastMsg, setToastMsg] = useState(null);
  const { reset } = useBuilderOverrides();

  const share = async () => {
    if (approvedMode) {
      setToastMsg("This is an approved snapshot (read-only). Copy the URL as-is.");
      clearTimeout(window.__share_toast_timer);
      window.__share_toast_timer = setTimeout(() => setToastMsg(null), 2200);
      return;
    }

    // 1) Build the exact payload you already decode on load
    const payload = encodeState(packSnapshot({ blocks, globalTheme }));

    const url = `${location.origin}${location.pathname}#${payload}`;

    // 2) Replace the hash once (don’t assign location.hash separately)
    try {
      history.replaceState(null, "", `#${payload}`);
    } catch {
      // no-op; worst case the URL won’t update but payload still copies
    }

    // 3) Copy to clipboard with fallback
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setToastMsg("Share link copied to clipboard");
      } else {
        throw new Error();
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        setToastMsg(ok ? "Share link copied to clipboard" : "Copy failed — link in address bar");
      } catch {
        setToastMsg("Copy failed — link in address bar");
      }
    }

    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToastMsg(null), 2000);
  };


  function buildShareUrl() {
    // 1) collect builder state (use your existing getters)
    const blocks = getBlocksSomehow?.() || blocks;        // <- keep your source of truth here
    const overrides = overridesBySection || null;         // if you need it

    // 2) collect theme snapshot (exact colors + fonts)
    const theme = snapshotThemeNow();

    // 3) pack everything
    const payload = { blocks, overrides, theme, meta: { v: 1 } };
    const hash = encodeState(payload);

    // 4) make URL with hash only (no onboarding flags)
    return `${location.origin}${location.pathname}#${hash}`;
  }

  function onShareClick() {
    const url = buildShareUrl();
    navigator.clipboard?.writeText(url).catch(() => { });
    // your toast/snackbar here…
  }

  const resetAll = () => {
    if (approvedMode) return;
    setBlocks([{ id: uid(), type: "hero", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }]);
    setGlobalTheme({
      colors: {
        background: "#ffffff",
        foreground: "#18181b",
        "muted-background": "#d7d7dc",
        "muted-foreground": "#71717a",
        "alt-background": "#f0f0f9",
        "alt-foreground": "#000000",
        primary: "#000000",
        "primary-foreground": "#ffffff",
        border: "#e4e4e7",
        secondary: "#F1F5F9",
        "secondary-foreground": "#71717a",
      },
    });
    
    
    const payload = encodeState({ blocks: [], globalTheme: { colors: {} } });
    history.replaceState(null, "", `#${payload}`);
    setToastMsg("Reset to defaults");
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToastMsg(null), 1600);
  };



  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalLink, setApprovalLink] = useState("");
  const [approvalMeta, setApprovalMeta] = useState({
    customerName: "", projectId: "", notes: "", approverName: "", approverEmail: "",
  });

  const submitViaEmail = async () => {
    try {
      const snapshot = {
        blocks, globalTheme,
        meta: { ...approvalMeta, approved: true, approvedAt: new Date().toISOString() },
      };
      const payload = encodeState(snapshot);
      const url = `${location.origin}${location.pathname}#${payload}`;
      setApprovalLink(url);

      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalLink: url, snapshot, approvalMeta }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("handoff error:", data);
        setToastMsg(
          data?.error
            ? `Handoff failed: ${data.error}${data.missing ? ` (${data.missing.join(", ")})` : ""}`
            : "Handoff failed. Check server logs/env vars."
        );
        clearTimeout(window.__share_toast_timer);
        window.__share_toast_timer = setTimeout(() => setToastMsg(null), 3200);
        return;
      }
      setApproveOpen(false);
    } catch (err) {
      console.error(err);
      setToastMsg("Handoff failed due to a network or server error.");
      clearTimeout(window.__share_toast_timer);
      window.__share_toast_timer = setTimeout(() => setToastMsg(null), 3200);
    }
  };

  const makeApprovalSnapshot = () => {
    const meta = {
      approved: true,
      approvedAt: new Date().toISOString(),
      customerName: approvalMeta.customerName?.trim() || undefined,
      projectId: approvalMeta.projectId?.trim() || undefined,
      notes: approvalMeta.notes?.trim() || undefined,
    };
    const snapshot = { blocks, globalTheme, meta };
    const payload = encodeState(snapshot);
    const url = `${location.origin}${location.pathname}#${payload}`;
    return { snapshot, url };
  };

  const handleApprove = () => {
    const { url } = makeApprovalSnapshot();
    setApprovalLink(url);
    setApproveOpen(true);
  };

  const copyApprovalLink = async () => {
    try { await navigator.clipboard.writeText(approvalLink); setToastMsg("Approval link copied"); }
    catch { setToastMsg("Copy failed — use the field below"); }
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToastMsg(null), 1600);
  };

  // Discovery handlers
  const handlePartsDiscovered = useCallback((blockId, foundParts) => {
    const arr = Array.isArray(foundParts) ? foundParts : foundParts && typeof foundParts === "object" ? Object.values(foundParts) : [];
    setPartsByBlock((prev) => ({ ...prev, [blockId]: arr }));
    if (blockId === "Navbar") {
      setNavbarControls((prev) => pruneControls(prev || {}, arr));
    } else if (blockId === "Footer") {
      setFooterControls((prev) => pruneControls(prev || {}, arr));
    } else {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, controls: pruneControls(b.controls || {}, arr) } : b)));
    }
  }, []);
  const handleCopyDiscovered = useCallback((blockId, foundCopyParts) => {
    const normalized = normalizeCopyParts(foundCopyParts);
    setCopyPartsByBlock((prev) => ({ ...prev, [blockId]: normalized }));
    if (blockId === "Navbar") {
      setNavbarCopy((prev) => pruneCopy(prev || {}, normalized));
    } else if (blockId === "Footer") {
      setFooterCopy((prev) => pruneCopy(prev || {}, normalized));
    } else {
      setBlocks(prev => prev.map(b => (b.id === blockId ? { ...b, copy: pruneCopy(b.copy || {}, normalized) } : b)));
    }
  }, []);

  // Block helpers
  function handleDelete(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => arr.filter((b) => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  }
  function handleDuplicate(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i === -1) return arr;
      const original = arr[i];
      const newId = crypto?.randomUUID?.() ?? `${original.id}-${Date.now()}`;
      const copy = { ...original, id: newId, label: original.label ? `${original.label} (copy)` : original.label };
      return [...arr.slice(0, i + 1), copy, ...arr.slice(i + 1)];
    });
  }
  function handleMoveUp(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i <= 0) return arr;
      const next = arr.slice();[next[i - 1], next[i]] = [next[i], next[i - 1]]; return next;
    });
  }
  function handleMoveDown(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i === -1 || i >= arr.length - 1) return arr;
      const next = arr.slice();[next[i + 1], next[i]] = [next[i], next[i + 1]]; return next;
    });
  }

  function handleAddSectionAt(index, type = "hero") {
    if (approvedMode) return;
    const newBlock = {
      id: crypto?.randomUUID?.() ?? `b_${Date.now()}`,
      type, variant: 0, controls: {}, copy: {},
      overrides: { enabled: false, values: {}, valuesPP: {} },
    };
    setBlocks((arr) => {
      const before = arr.slice(0, index);
      const after = arr.slice(index);
      return [...before, newBlock, ...after];
    });
    setActiveBlockId(newBlock.id);
    setPicker({ open: false, index: null });
  }

  function onTogglePartFromSidebar(partId, nextVisible) {
    if (approvedMode || !activeBlockId) return;
    if (activeBlockId === "Navbar") {
      setNavbarControls((prev) => ({ ...(prev || {}), [partId]: !!nextVisible }));
      return;
    }
    if (activeBlockId === "Footer") {
      setFooterControls((prev) => ({ ...(prev || {}), [partId]: !!nextVisible }));
      return;
    }
    setBlocks((arr) =>
      arr.map((x) =>
        x.id === activeBlockId
          ? { ...x, controls: { ...(x.controls || {}), [partId]: !!nextVisible } }
          : x
      )
    );
  }
  function onCopyChangeFromSidebar(partId, text) {
    if (approvedMode || !activeBlockId) return;
    if (activeBlockId === "Navbar") {
      setNavbarCopy((prev) => ({ ...(prev || {}), [partId]: text }));
      return;
    }
    if (activeBlockId === "Footer") {
      setFooterCopy((prev) => ({ ...(prev || {}), [partId]: text }));
      return;
    }
    setBlocks((arr) =>
      arr.map((x) =>
        x.id === activeBlockId ? { ...x, copy: { ...(x.copy || {}), [partId]: text } } : x
      )
    );
  }

  if (!hydrated) {
    return <div className="min-h-screen grid place-items-center text-gray-500">Loading…</div>;
  }

  // Fixed section variants/components
  const NAVBAR_VARIANT = SECTIONS?.Navbar?.defaultVariant ?? 0;
  const NavbarCmp = SECTIONS?.Navbar?.variants?.[NAVBAR_VARIANT] ?? NavbarA;
  const FOOTER_VARIANT = SECTIONS?.Footer?.defaultVariant ?? 0;
  const FooterCmp = SECTIONS?.Footer?.variants?.[FOOTER_VARIANT] ?? FooterA;

  // Derived view state
  let activeBlock = blocks.find((b) => b.id === activeBlockId) || null;
  if (!activeBlock && activeBlockId === "Navbar") {
    const navbarOverrides = overridesBySection.Navbar?.theme || { enabled: false, values: {}, valuesPP: {} };
    activeBlock = { id: "Navbar", type: "Navbar", variant: NAVBAR_VARIANT, controls: navbarControls, copy: navbarCopy, overrides: navbarOverrides };
  }
  if (!activeBlock && activeBlockId === "Footer") {
    const footerOverrides = overridesBySection.Footer?.theme || { enabled: false, values: {}, valuesPP: {} };
    activeBlock = { id: "Footer", type: "Footer", variant: FOOTER_VARIANT, controls: footerControls, copy: footerCopy, overrides: footerOverrides };
  }
  const firstBlockId = blocks[0]?.id ?? null;
  const openEditorOnFirst = () => firstBlockId && setActiveBlockId(firstBlockId);
  const partList = partsByBlock[activeBlockId] || [];
  const copyList = copyPartsByBlock[activeBlockId] || [];
  const variantIndex = activeBlock?.variant ?? 0;

  function resetThemeInApp() {
    try {
      localStorage.removeItem("theme.colors");
      localStorage.removeItem("theme.fonts");
    } catch { }

    // blow away any inline overrides first
    clearInlineColorVars();

    // rebuild from tokens.css
    const fresh = readTokenDefaults();
    const vars = buildThemeVars(fresh, "light");
    setCSSVars(document.documentElement, "colors", vars);

    // fonts + any other UI that depends on saved theme
    applySavedTheme("light");

    // (optional) toast/UI feedback here
  }
  

  const FOOTER_DEFAULT_DATA = {
    // mirrors defaults inside FooterPrimitive but allows builder overrides later
  };



  /* ------------------------------- UI ------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50 backdrop-blur" style={{ ["--header-h"]: "56px" }}>
        <div className="mx-auto w-full flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Landing Page Builder</h1>
            {approvedMode && (
              <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-200">
                Approved on {new Date(approvedMeta.approvedAt).toLocaleString()}
                {approvedMeta.projectId ? ` • ${approvedMeta.projectId}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a href="#/onboarding" onClick={(e) => { try { localStorage.removeItem("onboardingCompleted"); localStorage.removeItem("builderOverrides"); localStorage.removeItem("theme.colors"); localStorage.removeItem("theme.fonts"); reset(); } catch { } }} className="text-xs underline text-muted-foreground" >
              Restart onboarding
            </a>
            {/* darkmode
            <Button variant="outline" className="text-gray-500" onClick={() => setThemeMode((m) => (m === "light" ? "dark" : "light"))}>
              {themeMode === "light" ? "Dark mode" : "Light mode"}
            </Button> */}

            {!approvedMode ? (
              <>
                {/*} <ThemePopover globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} />
                <Button variant="outline" onClick={resetThemeInApp} className="text-gray-500">Reset</Button>*/}
                <Button variant="outline" onClick={share} className="text-gray-500">Share</Button>
                <Button onClick={() => setApproveOpen(true)}>Finish &amp; handoff</Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const obj = decodeState(location.hash.slice(1));
                    if (obj) {
                      const filename = `Design Snapshot - ${approvedMeta.projectId || "approved"} - ${approvedMeta.approvedAt?.slice(0, 19)?.replace(/[:T]/g, "-")}.json`;
                      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="text-gray-500"
                >
                  Export JSON
                </Button>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(location.href)}>
                  Copy Link
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex">
        {/* Sidebar trigger */}
        {!activeBlockId && blocks.length > 0 && (
          <button
            type="button"
            onClick={openEditorOnFirst}
            aria-label="Edit first section"
            className="fixed left-3 top-20 z-40 grid h-10 w-10 place-items-center rounded-full border bg-white shadow hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Pencil className="h-5 w-5 text-gray-700" />
          </button>

        )}
        {!activeBlockId && blocks.length > 0 && (
          <button
            type="button"
            onClick={() => setThemeOpen(true)}
            aria-label="Fonts & Colors"
            className="fixed left-3 top-32 z-40 grid h-10 w-10 place-items-center rounded-full border bg-white shadow hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Paintbrush className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Sidebar */}
        {activeBlockId && (
          <EditorSidebar
            activeBlockId={activeBlockId}
            activeBlock={activeBlock}
            partList={partList}
            copyList={copyList}
            approvedMode={approvedMode}
            SECTIONS_REG={SECTIONS}
            closePanel={closePanel}
            handleDelete={handleDelete}
            handleMoveUp={handleMoveUp}
            handleMoveDown={handleMoveDown}
            onTogglePartFromSidebar={onTogglePartFromSidebar}
            onCopyChangeFromSidebar={onCopyChangeFromSidebar}
            variantIndex={variantIndex}
            setVariantForId={setVariantForId}
            variantForId={variantForId}
            setBlocks={setBlocks}
            blocks={blocks}
            setNavbarOverrides={(overrides) => setSection("Navbar", { theme: overrides })}
            setFooterOverrides={(overrides) => setSection("Footer", { theme: overrides })}
            mode="builder"
          />
        )}

        {/* Canvas */}
        <main className="flex-1 p-4 flex justify-center box-border">
          <div className="w-full max-w-[800px] box-border">
            <div
              role="button"
              tabIndex={0}
              onClick={() => { setActiveBlockId("Navbar"); setVariantForId(null); setContentForId(null); window.dispatchEvent(new Event("lp:section-selected")); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setActiveBlockId("Navbar"); setVariantForId(null); setContentForId(null); window.dispatchEvent(new Event("lp:section-selected")); } }}
              className={[
                "relative transition",
                activeBlockId === "Navbar"
                  ? "z-10 outline outline-2 outline-blue-500 ring-0"
                  : "hover:z-20 hover:outline hover:outline-2 hover:outline-blue-500",
              ].join(" ")}
            >
              <AutoScaler designWidth={1440} targetWidth={800} maxHeight={9999}>
                <EditableSection
                  sectionId="Navbar"
                  label="Navbar"
                  variant={NAVBAR_VARIANT}
                  discoverKey={`Navbar:${NAVBAR_VARIANT}:${activeBlockId === "Navbar"}`}
                  controls={navbarControls}
                  copyValues={navbarCopy}
                  onPartsDiscovered={(list) => handlePartsDiscovered("Navbar", list)}
                  onCopyDiscovered={(list) => handleCopyDiscovered("Navbar", list)}
                  fixedPosition="top"
                >
                  <NavbarCmp />
                </EditableSection>
              </AutoScaler>
            </div>
            
            <div className="">
              {blocks.length === 0 ? (
                <div className="border border-dashed p-10 text-center text-gray-500">
                  No sections yet. Use the buttons on the left to add some 👈
                </div>
              ) : (
                <DndContext
                  collisionDetection={closestCenter}
                  sensors={sensors}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div style={{ background: "var(--colors-background)", color: "var(--colors-foreground)" }}>
                      {blocks.map((b, i) => (
                        <div key={b.id} className={i > 0 ? "-mt-px group relative" : "group relative"}>
                          <SortableBlock
                            id={b.id}
                            type={b.type}
                            variant={b.variant ?? 0}
                            controls={b.controls || {}}
                            copyValues={b.copy || {}}
                            parts={partsByBlock[b.id] || []}
                            onPartsDiscovered={handlePartsDiscovered}
                            onCopyDiscovered={(found) => handleCopyDiscovered(b.id, found)}
                            onTogglePart={(partId, nextVisible) => {
                              if (approvedMode) return;
                              setBlocks((arr) =>
                                arr.map((x) =>
                                  x.id === b.id ? { ...x, controls: { ...(x.controls || {}), [partId]: !!nextVisible } } : x
                                )
                              );
                            }}
                            onCopyChange={(partId, text) => {
                              if (approvedMode) return;
                              setBlocks((arr) =>
                                arr.map((x) =>
                                  x.id === b.id ? { ...x, copy: { ...(x.copy || {}), [partId]: text } } : x
                                )
                              );
                            }}
                            overrides={b.overrides || { enabled: false, values: {}, valuesPP: {} }}
                            onSetOverrides={(next) => {
                              if (approvedMode) return;
                              setBlocks((arr) => arr.map((x) => (x.id === b.id ? { ...x, overrides: next } : x)));
                            }}
                            availableThemeKeys={Object.keys(globalTheme.colors)}
                            onRemove={(id) => !approvedMode && setBlocks((arr) => arr.filter((blk) => blk.id !== id))}
                            onVariantPick={(id, variantIndex) =>
                              !approvedMode && setBlocks((arr) => arr.map((blk) => (blk.id === id ? { ...blk, variant: variantIndex } : blk)))
                            }
                            readOnly={approvedMode}
                            onSelect={() => setActiveBlockId(b.id)}
                            selected={activeBlockId === b.id}
                            variantOpen={variantForId === b.id}
                            onVariantOpenChange={(open) => setVariantForId(open ? b.id : (variantForId === b.id ? null : variantForId))}
                            contentOpen={contentForId === b.id}
                            onContentOpenChange={(open) => setContentForId(open ? b.id : (contentForId === b.id ? null : contentForId))}
                          />

                          {/* Inline "+ Section" handle */}
                          <div className="z-[9999] absolute inset-x-0 -bottom-5 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => setPicker({ open: true, index: i + 1 })}
                              variant="primary"
                              className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
                            >
                              + Section
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => { setActiveBlockId("Footer"); setVariantForId(null); setContentForId(null); window.dispatchEvent(new Event("lp:section-selected")); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setActiveBlockId("Footer"); setVariantForId(null); setContentForId(null); window.dispatchEvent(new Event("lp:section-selected")); } }}
              className={[
                "relative transition",
                activeBlockId === "Footer"
                  ? "z-10 outline outline-2 outline-blue-500 ring-0"
                  : "hover:z-20 hover:outline hover:outline-2 hover:outline-blue-500",
              ].join(" ")}
            >
              <AutoScaler designWidth={1440} targetWidth={800}>
                <EditableSection
                  sectionId="Footer"
                  label="Footer"
                  variant={FOOTER_VARIANT}
                  data={FOOTER_DEFAULT_DATA}
                  discoverKey={`Footer:${FOOTER_VARIANT}:${activeBlockId === "Footer"}`}
                  controls={footerControls}
                  copyValues={footerCopy}
                  onPartsDiscovered={(list) => handlePartsDiscovered("Footer", list)}
                  onCopyDiscovered={(list) => handleCopyDiscovered("Footer", list)}
                  fixedPosition="bottom"
                >
                  <FooterCmp data={FOOTER_DEFAULT_DATA} />
                </EditableSection>
              </AutoScaler>
            </div>
            {toastMsg && (
              <div className="fixed bottom-4 right-4 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                {toastMsg}
              </div>
            )}

            {/* Section Picker Dialog */}
            <Dialog open={picker.open} onOpenChange={(open) => setPicker((p) => ({ ...p, open }))}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Add a section</DialogTitle>
                  <DialogDescription>Choose what you want to insert below.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start" onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "hero")}>
                    Hero
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "extraPrizes")}>
                    Extra Prizes
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "winners")}>
                    Winners
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "WhoYouHelp")}>
                    How You Help
                  </Button>
                </div>
            
                <DialogFooter className="mt-2">
                  <Button variant="ghost" onClick={() => setPicker({ open: false, index: null })}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>

      <ThemeAside
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        onColorsChange={persistColors}
        onFontsChange={persistFonts}
        sectionOverrides={(() => {
          const acc = blocks.reduce((acc, block) => {
            if (block.overrides?.values && Object.keys(block.overrides.values).length > 0) {
              acc[block.type] = block.overrides;
            }
            return acc;
          }, {});
          
          // Add Navbar and Footer overrides from BuilderOverridesContext
          if (overridesBySection.Navbar?.theme?.values && Object.keys(overridesBySection.Navbar.theme.values).length > 0) {
            acc.Navbar = overridesBySection.Navbar.theme;
          }
          if (overridesBySection.Footer?.theme?.values && Object.keys(overridesBySection.Footer.theme.values).length > 0) {
            acc.Footer = overridesBySection.Footer.theme;
          }
          
          return acc;
        })()} />

      {/* Variant dock */}
      {blocks.find((b) => b.id === (null /* dock id unused here */)) && (
        <VariantDock open={false} type="hero" currentVariant={0} onPick={() => { }} onClose={() => { }} />
      )}

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Approve &amp; hand off to production</DialogTitle>
            <DialogDescription className="sr-only">
              Finalize this design and send details to production via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Approver name</label>
              <input
                className="w-full rounded-md border px-2 py-1 text-sm"
                placeholder="Jane Doe"
                value={approvalMeta.approverName}
                onChange={(e) => setApprovalMeta((m) => ({ ...m, approverName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Approver email</label>
              <input
                type="email"
                className="w-full rounded-md border px-2 py-1 text-sm"
                placeholder="jane@example.com"
                value={approvalMeta.approverEmail}
                onChange={(e) => setApprovalMeta((m) => ({ ...m, approverEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Customer / Company</label>
              <input
                className="w-full rounded-md border px-2 py-1 text-sm"
                placeholder="Acme Co."
                value={approvalMeta.customerName}
                onChange={(e) => setApprovalMeta((m) => ({ ...m, customerName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Project Name (optional)</label>
              <input
                className="w-full rounded-md border px-2 py-1 text-sm"
                placeholder="Summer Campaign"
                value={approvalMeta.projectId}
                onChange={(e) => setApprovalMeta((m) => ({ ...m, projectId: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Notes (optional)</label>
              <textarea
                rows={3}
                className="w-full rounded-md border px-2 py-1 text-sm"
                placeholder="Any special instructions…"
                value={approvalMeta.notes}
                onChange={(e) => setApprovalMeta((m) => ({ ...m, notes: e.target.value }))}
              />
            </div>

            <div className="pt-2">
              <Button className="w-full" onClick={submitViaEmail}>Submit to Production</Button>
            </div>

            {approvalLink && (
              <div className="text-[11px] text-gray-600">
                Approval link generated: <span className="break-all">{approvalLink}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>

  );

}

/* ------------------------------------------------------------------ */
/* Optional exports used elsewhere (left untouched)                    */
/* ------------------------------------------------------------------ */

// NOTE: If your app only ever renders <App />, you can ignore these.
// Kept as-is so nothing breaks if another file imports them.


export function AppRouterShell() {
  const route = useHashRoute();
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const isSnapshot = !!hash && !hash.startsWith("/");

  // If a share/snapshot URL is present, mark onboarding completed and go straight to the builder.
  useEffect(() => {
    if (isSnapshot) {
      try { localStorage.setItem("onboardingCompleted", "1"); } catch { }
    }
  }, [isSnapshot]);

  if (isSnapshot) {
    return <MainBuilder />;  // <-- render builder even if onboarding wasn't completed before
  }

  const done = localStorage.getItem("onboardingCompleted") === "1";
  if (route === "/onboarding" || !done) return <OnboardingWizard />;
  return <MainBuilder />;
}
export default AppRouterShell;



/* ------------------------------------------------------------------ */
/* Hooks                                                              */
/* ------------------------------------------------------------------ */

function useElementWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => setW(ref.current?.clientWidth || 0));
    ro.observe(ref.current);
    setW(ref.current?.clientWidth || 0);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

