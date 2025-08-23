// src/App.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { HeroA, HeroB } from "./sections/Hero.jsx";
import { PricingA, PricingB } from "./sections/Pricing.jsx";
import { TestimonialsA, TestimonialsB } from "./sections/Testimonials.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "./sections/Winners.jsx";

// DnD Kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Icons
import { Plus } from "lucide-react";

// UI
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

// Helpers
import AutoScaler from "@/components/AutoScaler";
import useElementWidth from "@/hooks/useElementWidth";
import EditableSection from "@/components/EditableSection";



/* ----------------------------- Helpers ----------------------------- */

const uid = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now();

const pruneControls = (controls = {}, partsList) => {
  const arr = Array.isArray(partsList)
    ? partsList
    : partsList && typeof partsList === "object"
      ? Object.values(partsList)
      : [];
  const allow = new Set(arr.map((p) => p?.id).filter(Boolean));
  return Object.fromEntries(Object.entries(controls || {}).filter(([k]) => allow.has(k)));
};

const pruneCopy = (copyValues = {}, copyParts = []) => {
  const allow = new Set(copyParts.map((p) => p.id));
  return Object.fromEntries(Object.entries(copyValues).filter(([k]) => allow.has(k)));
};

const setCSSVars = (el, prefix, obj) => {
  if (!el || !obj) return;
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === "") return;
    el.style.setProperty(`--${prefix}-${k}`, String(v));
  });
};

// Safe URL state encoding
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

// Defaults used for Reset
const DEFAULT_GLOBAL_THEME = {
  colors: {
    background: "#ffffff",
    foreground: "#18181b",
    "muted-foreground": "#71717a",
    "alt-background": "#f6f6f6",
    "alt-foreground": "#18181b",
    primary: "#000000",
    "primary-foreground": "#ffffff",
    border: "#e4e4e7",
  },
};
const makeDefaultBlocks = () => ([
  {
    id: uid(),
    type: "hero",
    variant: 0,
    controls: {},
    copy: {},
    // hero supports both palettes in overrides
    overrides: { enabled: false, values: {}, valuesPP: {} },
  },
]);

/* ----------------------------- Sections ---------------------------- */

const SECTIONS = {
  hero: {
    label: "Hero",
    variants: [HeroA, HeroB],
    labels: ["Hero A", "Hero B"],
  },
  extraPrizes: {
    label: "Extra Prizes",
    variants: [ExtraPrizesA, ExtraPrizesB],
    labels: ["Extra Prizes A", "Extra Prizes B"],
  },
  pricing: {
    label: "Pricing",
    variants: [PricingA, PricingB],
    labels: ["Pricing A", "Pricing B"],
  },
  testimonials: {
    label: "Testimonials",
    variants: [TestimonialsA, TestimonialsB],
    labels: ["Testimonials A", "Testimonials B"],
  },
  winners: {
    label: "Winners",
    variants: [WinnersA, WinnersB],
    labels: ["Winners A", "Winners B"],
  },
};

/* ------------------------- Theme Popover (Global) ------------------ */

function ThemePopover({ globalTheme, setGlobalTheme }) {
  const colors = globalTheme?.colors ?? {};
  const set = (key, val) =>
    setGlobalTheme((t) => ({
      ...t,
      colors: { ...(t.colors || {}), [key]: val },
    }));

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
          {Object.keys(colors).map((keyName) => (
            <Row key={keyName} label={keyName.replace(/-/g, " ")} keyName={keyName} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------- Section Overrides Popover ------------------ */
/** For non-hero sections → single palette.
 *  For hero → two palettes:
 *    1) Hero palette (writes --Hero-Colors-*)
 *    2) Price Points inside Hero (writes --PP-Colors-*)
 */
function SectionThemePopover({
  type,
  overrides = {},              // hero: { enabled, values: {...}, valuesPP: {...} } ; others: { enabled, values: {...} }
  onSetOverrides,              // (next) => void
  availableKeys = [],          // e.g. Object.keys(globalTheme.colors)
  title = "Section overrides",
}) {
  const enabled = !!overrides.enabled;

  // single-palette (non-hero)
  const values = overrides.values || {};
  // extra PP palette only for hero
  const valuesPP = overrides.valuesPP || {};

  const setEnabled = (v) =>
    onSetOverrides({ ...overrides, enabled: !!v });

  const setValMain = (key, val) =>
    onSetOverrides({
      ...overrides,
      enabled: true,
      values: { ...(overrides.values || {}), [key]: val },
    });

  const setValPP = (key, val) =>
    onSetOverrides({
      ...overrides,
      enabled: true,
      valuesPP: { ...(overrides.valuesPP || {}), [key]: val },
    });

  const Row = ({ label, keyName, value, onChange }) => (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        type="color"
        disabled={!enabled}
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
        <Button variant="ghost" size="sm" className="text-purple-700">
          Overrides
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="bottom" align="end" sideOffset={8}>
        <div className="mb-2 text-sm font-semibold">{title}</div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">Enable overrides</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Main palette */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500">
            {type === "hero" ? "Hero palette" : "Section palette"}
          </div>
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

        {/* PP palette only for hero */}
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

/* ---------------------- Change Variant (Dialog) -------------------- */

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
          <DialogTitle className="text-sm font-semibold">
            Choose {entry.label} Variant
          </DialogTitle>
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
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Sortable Block ------------------------ */

function SortableBlock({
  id,
  type,
  variant,
  controls,
  copyValues,
  parts,
  onPartsDiscovered,
  onCopyDiscovered,
  onTogglePart,
  onCopyChange,
  onRemove,
  onVariantPick,
  overrides,
  onSetOverrides,
  availableThemeKeys = [],
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const entry = SECTIONS[type];
  if (!entry) return null;

  const variants = entry.variants || [];
  const labels = entry.labels || entry.variantLabels || [];
  const safeIndex = Math.min(
    Math.max(0, Number.isInteger(variant) ? variant : 0),
    Math.max(0, variants.length - 1)
  );
  const Comp =
    variants[safeIndex] || (() => <div className="rounded border p-4 text-sm">Missing variant</div>);
  const headerLabel = `${entry.label} — ${labels[safeIndex] ?? `Variant ${safeIndex + 1}`}`;

  const contentRef = useRef(null);
  const contentWidth = useElementWidth(contentRef);
  const targetWidth = Math.max(320, Math.min(1440, contentWidth || 0));

  // Local list of copy-editable parts for the Edit popover
  const [copyParts, setCopyParts] = useState([]);

  // Ensure `parts` is an array
  const listParts = Array.isArray(parts)
    ? parts
    : parts && typeof parts === "object"
      ? Object.values(parts)
      : [];

  // Build override styles
  // We write BOTH PascalCase and lowercase var names to be safe with class usage.
  const emitVars = (entries, prefix, values) => {
    if (!values) return;
    const keys = [
      "background",
      "foreground",
      "muted-foreground",
      "alt-background",
      "alt-foreground",
      "primary",
      "primary-foreground",
      "border",
      "secondary",
      "secondary-foreground",
    ];
    const variants = [prefix, prefix.toLowerCase()];
    for (const pfx of variants) {
      for (const k of keys) {
        const v = values[k];
        if (!v) continue;
        entries.push([`--${pfx}-${k}`, v]);
      }
    }
  };

  const overrideStyle = useMemo(() => {
    if (!overrides?.enabled) return undefined;
    const out = [];

    if (type === "hero") {
      // Main hero palette
      emitVars(out, "Hero-Colors", overrides.values || {});
      // PP palette used inside Hero
      emitVars(out, "PP-Colors", overrides.valuesPP || {});
    } else if (type === "pricing") {
      emitVars(out, "PP-Colors", overrides.values || {});
    } else if (type === "extraPrizes") {
      emitVars(out, "EB-Colors", overrides.values || {});
    } else if (type === "testimonials") {
      // If you add dedicated tokens later (e.g., TT-Colors), emit here:
      // emitVars(out, "TT-Colors", overrides.values || {});
    }else if (type === "winners") {
      // If you add dedicated tokens later (e.g., TT-Colors), emit here:
      // emitVars(out, "TT-Colors", overrides.values || {});
    }

    return Object.fromEntries(out);
  }, [overrides, type]);

  return (
    <div
      ref={setNodeRef}
      style={overrideStyle}
      className={[
        "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200",
        isDragging ? "opacity-75" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-md px-2 py-1 hover:bg-gray-100 active:cursor-grabbing"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            ⠿
          </span>
          <span className="font-medium text-gray-700">{headerLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Change variant (Preview list) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Change variant
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              className="w-full p-0 overflow-hidden rounded-2xl shadow-lg box-border"
            >
              <div className="px-3 py-2">
                <div className="text-sm font-semibold">Choose {entry.label} Variant</div>
              </div>
              <Separator />
              <ScrollArea className="h-[60vh] bg-white box-border">
                <div className="space-y-6 p-6 box-border">
                  {variants.map((Preview, i) => (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => onVariantPick(id, i)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onVariantPick(id, i)}
                      className={[
                        "w-full max-w-full overflow-hidden rounded-xl border bg-white text-left transition",
                        i === safeIndex ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white" : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <div className="px-3 pt-2 text-xs font-medium text-gray-700">
                        {labels[i] ?? `Variant ${i + 1}`}
                      </div>
                      <div className="p-2">
                        <div className="overflow-hidden rounded-lg">
                          <AutoScaler designWidth={1440} targetWidth={280} maxHeight={520}>
                            {/* Preview uses current overrides too */}
                            <div data-scope={type} style={overrideStyle}>
                              <EditableSection
                                discoverKey={`${type}:${i}`}
                                controls={controls}
                                copyValues={copyValues}
                              >
                                <Preview />
                              </EditableSection>
                            </div>
                          </AutoScaler>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Edit variant (Switches + Copy) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-emerald-700">
                Edit variant
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80 p-0 rounded-2xl shadow-lg">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold">Customize Section</div>
                <div className="text-xs text-gray-500">Show / hide optional elements in this section</div>
              </div>
              <Separator />
              <ScrollArea className="max-h-[60vh] p-3">
                {/* Optional Sections */}
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
                            onClick={() => onTogglePart(p.id, !checked)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") && onTogglePart(p.id, !checked)
                            }
                            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            <span className="truncate">{p.label}</span>
                            <Switch
                              checked={checked}
                              onCheckedChange={(v) => onTogglePart(p.id, v)}
                              className="pointer-events-none h-4 w-7"
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
                        copyValues && typeof copyValues[p.id] === "string"
                          ? copyValues[p.id]
                          : p.defaultText;
                      const max = p.maxChars || 120;
                      return (
                        <div key={p.id} className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">{p.label}</label>
                          <input
                            type="text"
                            value={current}
                            maxLength={max}
                            onChange={(e) => onCopyChange(p.id, e.target.value)}
                            className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Up to ${max} characters`}
                          />
                          <div className="text-right text-[11px] text-gray-400">
                            {current?.length ?? 0}/{max}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Section Overrides */}
          <SectionThemePopover
            type={type}
            overrides={overrides || { enabled: false, values: {} }}
            onSetOverrides={(next) =>
              onSetOverrides(next)
            }
            availableKeys={availableThemeKeys}
          />

          {/* Delete */}
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onRemove(id)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Canvas content */}
      <div ref={contentRef} style={overrideStyle}>
        <AutoScaler designWidth={1440} targetWidth={targetWidth} maxHeight={9999}>
          <div data-scope={type} style={overrideStyle}>
            <EditableSection
              discoverKey={`${type}:${safeIndex}`}
              controls={controls}
              copyValues={copyValues}
              onPartsDiscovered={(found) => onPartsDiscovered?.(id, found)}
              onCopyDiscovered={(found) => setCopyParts(found)}
            >
              <Comp />
            </EditableSection>
          </div>
        </AutoScaler>
      </div>
    </div>
  );
}

/* ------------------------------- App ------------------------------- */

export default function App() {
  // Blocks: { id, type, variant, controls, copy, overrides }
  // hero.overrides supports: { enabled, values: {...Hero-Colors}, valuesPP: {...PP-Colors} }
  const [blocks, setBlocks] = useState([
    { id: uid(), type: "hero", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } },
  ]);

  // parts discovered per block (for switches UI)
  const [partsByBlock, setPartsByBlock] = useState({});

  // Global theme (root CSS variables)
  const [globalTheme, setGlobalTheme] = useState({
    colors: {
      background: "#ffffff",
      foreground: "#18181b",
      "muted-foreground": "#71717a",
      "alt-background": "#f6f6f6",
      "alt-foreground": "#18181b",
      primary: "#000000",
      "primary-foreground": "#ffffff",
      border: "#e4e4e7",
    },
  });

    const [hydrated, setHydrated] = useState(false);

  // Apply global variables to :root
  useEffect(() => {
    setCSSVars(document.documentElement, "colors", globalTheme.colors);
  }, [globalTheme]);



  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    setBlocks((arr) => arrayMove(arr, oldIndex, newIndex));
  };

  // Load from URL hash
 useEffect(() => {
  const hash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  if (hash) {
    const loaded = decodeState(hash);

    // Old links: the entire payload was just an array of blocks
    if (Array.isArray(loaded)) {
      setBlocks(
        loaded.map((b) => ({
          id: b.id,
          type: b.type,
          variant: Number.isInteger(b.variant) ? b.variant : 0,
          controls: b.controls || {},
          copy: b.copy || {},
          overrides: b.overrides || { enabled: false, values: {}, valuesPP: {} },
        }))
      );
    }

    // New links: { blocks, theme }
    if (loaded && typeof loaded === "object") {
      if (Array.isArray(loaded.blocks)) {
        setBlocks(
          loaded.blocks.map((b) => ({
            id: b.id,
            type: b.type,
            variant: Number.isInteger(b.variant) ? b.variant : 0,
            controls: b.controls || {},
            copy: b.copy || {},
            overrides: b.overrides || { enabled: false, values: {}, valuesPP: {} },
          }))
        );
      }
      if (loaded.theme && typeof loaded.theme === "object") {
        setGlobalTheme((t) => ({
          ...t,
          colors: { ...(t.colors || {}), ...(loaded.theme || {}) },
        }));
      }
    }
  }

  setHydrated(true);
}, []);
  // Persist to URL hash
useEffect(() => {
  if (!hydrated) return;
  const payload = encodeState({
    blocks,
    theme: globalTheme.colors, // <— include theme
  });
  history.replaceState(null, "", `#${payload}`);
}, [blocks, globalTheme, hydrated]);

  // Share
  const [toast, setToast] = useState(null);

  const resetAll = () => {
  // reset state
  setBlocks(makeDefaultBlocks());
  setPartsByBlock({});
  setGlobalTheme(DEFAULT_GLOBAL_THEME);

  // clear CSS vars on :root and re-apply globals
  const root = document.documentElement;
  // (Optional) You can clear known keys if you want, but re-applying is usually enough:
  Object.entries(DEFAULT_GLOBAL_THEME.colors).forEach(([k, v]) => {
    root.style.setProperty(`--colors-${k}`, v);
  });

  // clear URL hash so a fresh page load shows defaults
  history.replaceState(null, "", location.pathname);
  // feedback
  setToast("Reset to defaults");
  clearTimeout(window.__share_toast_timer);
  window.__share_toast_timer = setTimeout(() => setToast(null), 1500);
};

// --- rock-solid share() with multiple fallbacks ---
const share = async () => {
  // build the exact same object we persist in the effect
  const payload = encodeState({
    blocks,
    theme: globalTheme.colors,
  });
  const url = `${location.origin}${location.pathname}#${payload}`;

  // keep your existing clipboard fallbacks
  location.hash = payload;
  history.replaceState(null, "", `#${payload}`);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      setToast("Share link copied to clipboard");
    } else {
      throw new Error("Secure clipboard not available");
    }
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    setToast(ok ? "Share link copied to clipboard" : "Copy failed — link is in the address bar");
  }
  clearTimeout(window.__share_toast_timer);
  window.__share_toast_timer = setTimeout(() => setToast(null), 2000);
};

  // CRUD
  const addBlock = (type, variant = 0) =>
    setBlocks((arr) => [
      ...arr,
      {
        id: uid(),
        type,
        variant,
        controls: {},
        copy: {},
        overrides: { enabled: false, values: {}, valuesPP: {} },
      },
    ]);

  const removeBlock = (id) => setBlocks((arr) => arr.filter((b) => b.id !== id));

  const setVariant = (id, variantIndex) =>
    setBlocks((arr) => arr.map((b) => (b.id === id ? { ...b, variant: variantIndex } : b)));

  // Discovery handlers
  const handlePartsDiscovered = useCallback((blockId, foundParts) => {
    const arr = Array.isArray(foundParts)
      ? foundParts
      : foundParts && typeof foundParts === "object"
        ? Object.values(foundParts)
        : [];

    setPartsByBlock((prev) => ({ ...prev, [blockId]: arr }));

    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, controls: pruneControls(b.controls || {}, arr) } : b
      )
    );
  }, []);

  const handleCopyDiscovered = useCallback((blockId, foundCopyParts) => {
    const arr = Array.isArray(foundCopyParts)
      ? foundCopyParts
      : foundCopyParts && typeof foundCopyParts === "object"
        ? Object.values(foundCopyParts)
        : [];
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, copy: pruneCopy(b.copy || {}, arr) } : b))
    );
  }, []);

  // Optional VariantDock (not currently triggered)
  const [dockBlockId, setDockBlockId] = useState(null);
  const active = blocks.find((b) => b.id === dockBlockId) || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold tracking-tight text-gray-900">
            LP Builder — Multiple Blocks
          </h1>
          <div className="flex items-center gap-2">
            <ThemePopover globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} />
            <Button variant="outline" onClick={resetAll} className="text-gray-500">
  Reset
</Button>
            <Button variant="outline" onClick={share} className="text-gray-500">
              Share
            </Button>
            
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-gray-700">Sections</div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => addBlock("hero", 0)}>
                <Plus /> Hero
              </Button>
             {/* <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => addBlock("pricing", 0)}>
                <Plus /> Pricing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-500"
                onClick={() => addBlock("testimonials", 0)}
              >
                <Plus /> Testimonials
              </Button>*/}
              <Button
                variant="outline"
                className="w-full justify-start text-gray-500"
                onClick={() => addBlock("extraPrizes", 0)}
              >
                <Plus /> Extra Prizes
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-500"
                onClick={() => addBlock("winners", 0)}
              >
                <Plus /> Winners
              </Button>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="col-span-12 lg:col-span-9">
          <div className="space-y-4">
            {blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
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
                  <div className="space-y-4">
                    {blocks.map((b) => (
                      <SortableBlock
                        key={b.id}
                        id={b.id}
                        type={b.type}
                        variant={b.variant ?? 0}
                        controls={b.controls || {}}
                        copyValues={b.copy || {}}
                        parts={partsByBlock[b.id] || []}
                        onPartsDiscovered={handlePartsDiscovered}
                        onCopyDiscovered={(found) => handleCopyDiscovered(b.id, found)}
                        onTogglePart={(partId, nextVisible) => {
                          setBlocks((arr) =>
                            arr.map((x) =>
                              x.id === b.id
                                ? { ...x, controls: { ...(x.controls || {}), [partId]: !!nextVisible } }
                                : x
                            )
                          );
                        }}
                        onCopyChange={(partId, text) => {
                          setBlocks((arr) =>
                            arr.map((x) =>
                              x.id === b.id ? { ...x, copy: { ...(x.copy || {}), [partId]: text } } : x
                            )
                          );
                        }}
                        overrides={b.overrides || { enabled: false, values: {}, valuesPP: {} }}
                        onSetOverrides={(next) =>
                          setBlocks((arr) =>
                            arr.map((x) => (x.id === b.id ? { ...x, overrides: next } : x))
                          )
                        }
                        availableThemeKeys={Object.keys(globalTheme.colors)}
                        onRemove={removeBlock}
                        onVariantPick={setVariant}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {toast && (
            <div className="fixed bottom-4 right-4 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
              {toast}
            </div>
          )}
        </main>
      </div>

      {/* Optional VariantDock (not currently triggered) */}
      {active && (
        <VariantDock
          open={!!active}
          type={active?.type}
          currentVariant={active?.variant ?? 0}
          onPick={(v) => setVariant(active.id, v)}
          onClose={() => setDockBlockId(null)}
        />
      )}
    </div>
  );
}