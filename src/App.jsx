// src/App.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { HeroA, HeroB } from "./sections/Hero.jsx";
import { PricingA, PricingB } from "./sections/Pricing.jsx";
import { TestimonialsA, TestimonialsB } from "./sections/Testimonials.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./sections/ExtraPrizes.jsx";
import { WinnersA, WinnersB } from "./sections/Winners.jsx";

// Robust imports for AutoScaler + EditableSection
import * as AutoScalerMod from "@/components/AutoScaler";
import * as EditableSectionMod from "@/components/EditableSection";

const AutoScaler =
  AutoScalerMod.default ??
  AutoScalerMod.AutoScaler ??
  (({ children }) => <div className="w-full">{children}</div>);

const EditableSection =
  EditableSectionMod.default ??
  EditableSectionMod.EditableSection ??
  (({ children }) => <>{children}</>);

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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { X } from "lucide-react";

import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Icons
import { Plus, ChevronDown, ArrowRight, Pencil } from "lucide-react";

// UI
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, } from "@/components/ui/dropdown-menu";
import SectionActionsMenu from "./components/SectionActionsMenu";

import { buildThemeVars } from "./theme-utils";

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

// NEW: make a stable id from a label when id is missing
const slugify = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCopyParts = (list) => {
  const arr = Array.isArray(list)
    ? list
    : list && typeof list === "object"
      ? Object.values(list)
      : [];
  return arr
    .map((p) => {
      const id =
        p.id ??
        p.copyId ??       // if EditableSection emits this
        p.key ??          // safety
        slugify(p.label); // final fallback from data-label
      return id ? { ...p, id } : null;
    })
    .filter(Boolean);
};

const pruneCopy = (copyValues = {}, copyParts = []) => {
  // NEW: ensure ids exist before we build the allow set
  const normalized = normalizeCopyParts(copyParts);
  const allow = new Set(normalized.map((p) => p.id));
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
// === PRODUCTION EMAIL (set this!)
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

function packSnapshot(blocks, globalTheme) {
  return { blocks, globalTheme };
}
function unpackSnapshot(payload) {
  if (Array.isArray(payload)) return { blocks: payload, globalTheme: null };
  return payload || { blocks: [], globalTheme: null };
}

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
  const order = [
    "background",
    "foreground",
    "primary", "primary-foreground",
    "secondary", "secondary-foreground",
    "alt-background", "alt-foreground",
    "border",
  ];

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

          {order.filter(k => k in colors).map((keyName) => (
            <Row key={keyName} label={keyName.replace(/-/g, " ")} keyName={keyName} />
          ))}

          <div className="pt-2 text-xs text-gray-500">
            Muted background/foreground are auto-derived from your background & foreground.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------- Section Overrides Popover ------------------ */

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

  const setEnabled = (v) => {
    if (readOnly) return;
    onSetOverrides({ ...overrides, enabled: !!v });
  };

  const setValMain = (key, val) => {
    if (readOnly) return;
    onSetOverrides({
      ...overrides,
      enabled: true,
      values: { ...(overrides.values || {}), [key]: val },
    });
  };

  const setValPP = (key, val) => {
    if (readOnly) return;
    onSetOverrides({
      ...overrides,
      enabled: true,
      valuesPP: { ...(overrides.valuesPP || {}), [key]: val },
    });
  };

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
  readOnly = false,
  onSelect,
  selected,
  variantOpen,
  onVariantOpenChange,
  contentOpen,
  onContentOpenChange,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled: readOnly });
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

  const [copyParts, setCopyParts] = useState([]);

  const listParts = Array.isArray(parts)
    ? parts
    : parts && typeof parts === "object"
      ? Object.values(parts)
      : [];

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
      emitVars(out, "Hero-Colors", overrides.values || {});
      emitVars(out, "PP-Colors", overrides.valuesPP || {});
    } else if (type === "pricing") {
      emitVars(out, "PP-Colors", overrides.values || {});
    } else if (type === "extraPrizes") {
      emitVars(out, "EB-Colors", overrides.values || {});
    } else if (type === "winners") {
      emitVars(out, "Winners-Colors", overrides.values || {});
    }

    return Object.fromEntries(out);
  }, [overrides, type]);

  return (
    <div
      ref={setNodeRef}
      style={overrideStyle}
      className={[
        "relative bg-white shadow-sm transition overflow-visible",
        selected
          ? "z-10 outline  outline-2 outline-blue-500  ring-0"
          : "hover:z-20 hover:outline hover:outline-2 hover:outline-blue-500 ",
      ].join(" ")}

    >
      {/* Canvas content */}
      <div
        ref={contentRef}
        style={overrideStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}>

        <AutoScaler designWidth={1440} targetWidth={targetWidth} maxHeight={9999}>
          <div data-scope={type} style={overrideStyle}>
            <EditableSection
              discoverKey={`${id}:${type}:${safeIndex}`}
              controls={controls}
              copyValues={copyValues}
              onPartsDiscovered={(found) => onPartsDiscovered?.(id, found)}
              onCopyDiscovered={(found) => {
                // keep the popover list inside the block
                const arr = Array.isArray(found)
                  ? found
                  : found && typeof found === "object"
                    ? Object.values(found)
                    : [];
                setCopyParts(arr);

                // bubble UP with a SINGLE argument (the array)
                onCopyDiscovered?.(arr);
              }}
            >
              <Comp />
            </EditableSection>
          </div>
        </AutoScaler>
      </div>




      {/* EDIT CONTENT POPOVER */}
      <Popover open={!!contentOpen} onOpenChange={onContentOpenChange}>
        <PopoverTrigger asChild>
          <button type="button" aria-hidden="true" tabIndex={-1} className="absolute right-3 top-3 h-1 w-1 opacity-0" />
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="end"
          sideOffset={12}
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
                        onClick={() => !readOnly && onTogglePart(p.id, !checked)}
                        onKeyDown={(e) =>
                          !readOnly && (e.key === "Enter" || e.key === " ") && onTogglePart(p.id, !checked)
                        }
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
                        className="w-full rounded-md border p-2  text-sm outline focus:outline-2 focus:outline-blue-500"
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



/* ------------------------------- App ------------------------------- */

export default function App() {




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

  useEffect(() => {
    if (activeBlockId == null) {
      setVariantForId(null);
      setContentForId(null);
    }
  }, [activeBlockId]);

  useEffect(() => {
    if (!didAutoSelectOnce.current && !activeBlockId && blocks.length) {
      setActiveBlockId(blocks[0].id);
      didAutoSelectOnce.current = true; // never auto-select again
    }
  }, [activeBlockId, blocks]);

  const [partsByBlock, setPartsByBlock] = useState({});

  const [globalTheme, setGlobalTheme] = useState({
    colors: {
      background: "#ffffff",
      foreground: "#18181b",
      "alt-background": "#f0f0f9",
      "alt-foreground": "#000000",
      primary: "#000000",
      "primary-foreground": "#ffffff",
      border: "#e4e4e7",
      secondary: "#e4e4e7",
      "secondary-foreground": "#71717a",
    },
  });

// Light/Dark mode state
const [themeMode, setThemeMode] = useState("light");

// Start with system preference (optional)
useEffect(() => {
  const mq = window.matchMedia?.("(prefers-color-scheme: light)");
  if (mq) setThemeMode(mq.matches ? "dark" : "light");
  const onChange = (e) => setThemeMode(e.matches ? "dark" : "light");
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}, []);

// Write CSS vars whenever colors or mode change
useEffect(() => {
  const vars = buildThemeVars(globalTheme.colors, themeMode);
  setCSSVars(document.documentElement, "colors", vars);
  document.documentElement.setAttribute("data-theme", themeMode); // optional
}, [globalTheme, themeMode]);

  // (optional) start with system preference
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (mq) setThemeMode(mq.matches ? "dark" : "light");
    const onChange = (e) => setThemeMode(e.matches ? "dark" : "light");
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  // 2) write CSS vars whenever colors or mode change
  useEffect(() => {
    const vars = buildThemeVars(globalTheme.colors, themeMode);
    setCSSVars(document.documentElement, "colors", vars);
    document.documentElement.setAttribute("data-theme", themeMode); // optional data attr
  }, [globalTheme, themeMode]);

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

    try {
      window.location.href = mailto;
    } catch {
      navigator.clipboard?.writeText(`${formData.company} / ${formData.project}\n${url}`);
    }

    setHandoffOpen(false);
  };

  

  const [approvedMeta, setApprovedMeta] = useState(null);
  const approvedMode = !!approvedMeta?.approved;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event) => {
    if (approvedMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    setBlocks((arr) => arrayMove(arr, oldIndex, newIndex));
  };

  useEffect(() => {
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    if (!hash) {
      setHydrated(true);
      return;
    }
    const loaded = decodeState(hash);
    if (!loaded) {
      setHydrated(true);
      return;
    }

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
      setHydrated(true);
      return;
    }

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
      if (loaded.globalTheme?.colors) {
        const { ["muted-background"]: _mb, ["muted-foreground"]: _mf, ...rest } = loaded.globalTheme.colors;
        setGlobalTheme({ colors: rest });
      }
      if (loaded.meta?.approved) {
        setApprovedMeta({ ...loaded.meta });
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || approvedMode) return;
    const payload = encodeState(packSnapshot(blocks, globalTheme));
    history.replaceState(null, "", `#${payload}`);
  }, [blocks, globalTheme, hydrated, approvedMode]);

  const [toast, setToast] = useState(null);
  const share = async () => {
    if (approvedMode) {
      setToast("This is an approved snapshot (read-only). Copy the URL as-is.");
      clearTimeout(window.__share_toast_timer);
      window.__share_toast_timer = setTimeout(() => setToast(null), 2200);
      return;
    }
    let url = "";
    try {
      const payload = encodeState({ blocks, globalTheme });
      url = `${location.origin}${location.pathname}#${payload}`;
      location.hash = payload;
      history.replaceState(null, "", `#${payload}`);
    } catch (e) {
      setToast("Could not create share link");
      clearTimeout(window.__share_toast_timer);
      window.__share_toast_timer = setTimeout(() => setToast(null), 2200);
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setToast("Share link copied to clipboard");
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
        setToast(ok ? "Share link copied to clipboard" : "Copy failed — link in address bar");
      } catch {
        setToast("Copy failed — link in address bar");
      }
    }
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToast(null), 2000);
  };

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
        secondary: "#e4e4e7",
        "secondary-foreground": "#71717a"
      },
    });
    const payload = encodeState({ blocks: [], globalTheme: { colors: {} } });
    history.replaceState(null, "", `#${payload}`);
    setToast("Reset to defaults");
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToast(null), 1600);
  };

  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalLink, setApprovalLink] = useState("");

  const [approvalMeta, setApprovalMeta] = useState({
    customerName: "",
    projectId: "",
    notes: "",
    approverName: "",
    approverEmail: "",
  });

  const submitViaEmail = async () => {
    try {
      const snapshot = {
        blocks,
        globalTheme,
        meta: {
          ...approvalMeta,
          approved: true,
          approvedAt: new Date().toISOString(),
        },
      };
      const payload = encodeState(snapshot);
      const url = `${location.origin}${location.pathname}#${payload}`;
      setApprovalLink(url);

      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalLink: url,
          snapshot,
          approvalMeta,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("handoff 400:", data);
        return;
      }

      setApproveOpen(false);
    } catch (err) {
      console.error(err);
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

  const downloadJSON = (filename, dataObj) => {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleApprove = () => {
    const { snapshot, url } = makeApprovalSnapshot();
    setApprovalLink(url);
    setApproveOpen(true);
  };

  const copyApprovalLink = async () => {
    try {
      await navigator.clipboard.writeText(approvalLink);
      setToast("Approval link copied");
    } catch {
      setToast("Copy failed — use the field below");
    }
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToast(null), 1600);
  };

  function handleToggleVisibility(id) { }

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

  const [copyPartsByBlock, setCopyPartsByBlock] = useState({});

  const handleCopyDiscovered = useCallback((blockId, foundCopyParts) => {
    // NEW: normalize here as well (so sidebar always gets ids)

    const normalized = normalizeCopyParts(foundCopyParts);

    setCopyPartsByBlock((prev) => ({ ...prev, [blockId]: normalized }));

    setBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, copy: pruneCopy(b.copy || {}, normalized) } : b))
    );
  }, []);

  const [dockBlockId, setDockBlockId] = useState(null);
  const active = blocks.find((b) => b.id === dockBlockId) || null;

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Loading…
      </div>
    );
  }

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
      const newId =
        (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${original.id}-${Date.now()}`;
      const copy = { ...original, id: newId, label: original.label ? `${original.label} (copy)` : original.label };
      return [...arr.slice(0, i + 1), copy, ...arr.slice(i + 1)];
    });
  }

  function handleMoveUp(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i <= 0) return arr;
      const next = arr.slice();
      const tmp = next[i - 1];
      next[i - 1] = next[i];
      next[i] = tmp;
      return next;
    });
  }

  function handleMoveDown(id) {
    if (!id || approvedMode) return;
    setBlocks((arr) => {
      const i = arr.findIndex((b) => b.id === id);
      if (i === -1 || i >= arr.length - 1) return arr;
      const next = arr.slice();
      const tmp = next[i + 1];
      next[i + 1] = next[i];
      next[i] = tmp;
      return next;
    });
  }

  function handleAddSectionAt(index, type = "hero") {
    if (approvedMode) return;

    const newBlock = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `b_${Date.now()}`,
      type,
      variant: 0,
      controls: {},
      copy: {},
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
    setBlocks((arr) =>
      arr.map((x) =>
        x.id === activeBlockId
          ? { ...x, copy: { ...(x.copy || {}), [partId]: text } }
          : x
      )
    );
  }
  //close aside
  const activeBlock = blocks.find((b) => b.id === activeBlockId) || null;

  const firstBlockId = blocks[0]?.id ?? null;

  const openEditorOnFirst = () => {
    if (firstBlockId) setActiveBlockId(firstBlockId);
    // optional: if there are no blocks, you could open your "add section" flow here
  };



  const partList = partsByBlock[activeBlockId] || [];
  const copyList = copyPartsByBlock[activeBlockId] || [];
  const activeEntry = activeBlock ? SECTIONS[activeBlock.type] : null;
  const variantIndex = activeBlock?.variant ?? 0;
  //app return
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50  backdrop-blur" style={{ ['--header-h']: '56px' }}>
        <div className="mx-auto w-full flex  items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold tracking-tight text-gray-900">
              LP Builder — Multiple Blocks
            </h1>
            {approvedMode && (
              <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-200">
                Approved on {new Date(approvedMeta.approvedAt).toLocaleString()}
                {approvedMeta.projectId ? ` • ${approvedMeta.projectId}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-gray-500"
              onClick={() => setThemeMode((m) => (m === "light" ? "dark" : "light"))}
            >
              {themeMode === "light" ? "Dark mode" : "Light mode"}
            </Button>
            {!approvedMode && (
              <>
                <ThemePopover globalTheme={globalTheme} setGlobalTheme={setGlobalTheme} />
                <Button variant="outline" onClick={resetAll} className="text-gray-500">
                  Reset
                </Button>
                <Button variant="outline" onClick={share} className="text-gray-500">
                  Share
                </Button>

                <Button onClick={() => setApproveOpen(true)}>
                  Finish & handoff
                </Button>
              </>
            )}
            {approvedMode && (
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
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
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

      {/* Main layout */}
      <div className="flex">
        {/* Sidebar */}
        {!activeBlockId && blocks.length > 0 && (
          <button
            type="button"
            onClick={openEditorOnFirst}
            aria-label="Edit first section"
            className="
            fixed left-3 top-20 z-40
            grid h-10 w-10 place-items-center
            rounded-full border bg-white shadow
            hover:ring-2 hover:ring-blue-500
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          >
            <Pencil className="h-5 w-5 text-gray-700" />
          </button>
        )}
        {activeBlockId && (


          <aside className=" fixed left-4 top-18 z-40 w-[290px] sm:w-[290px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md border bg-white shadow-lg p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between ">
              <div className="text-md font-semibold  text-gray-700 mb-4">
                Section
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="">
              <div className="space-y-2">

                {/* --- Change Layout button anchored popover --- */}
                {/* Sidebar: Change Layout */}
                <div className="text-xs font-semibold text-gray-500 mb-2">Layout</div>
                <Popover
                  open={variantForId === activeBlockId}
                  onOpenChange={(open) => setVariantForId(open ? activeBlockId : null)}
                >
                  <PopoverTrigger asChild>

                    <Button

                      variant="outline"
                      className="w-full justify-start text-gray-500 justify-between mb-4"
                      disabled={approvedMode || !activeBlockId}
                    >

                      {activeEntry?.labels?.[variantIndex] ??
                        `${activeEntry?.label ?? "Variant"} ${variantIndex + 1}`}
                      <ArrowRight />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="z-[9999] w-[300px] box-border p-0 rounded-xl bg-white shadow-lg p-2 overflow-visible"
                  >
                    <div className="px-3 py-2 text-sm font-semibold">
                      Replace Component
                    </div>

                    <ScrollArea className="h-[60vh]  p-3 box-border [&_[data-radix-scroll-area-viewport]]:overflow-visible">
                      {(SECTIONS[activeBlock?.type]?.variants || []).map((Preview, i) => {
                        const labels = SECTIONS[activeBlock?.type]?.labels || [];
                        const selected = (activeBlock?.variant ?? 0) === i;
                        return (
                          <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (approvedMode || !activeBlockId) return;
                              setBlocks(arr => arr.map(b =>
                                b.id === activeBlockId ? { ...b, variant: i } : b
                              ));
                              setVariantForId(null); // close popover
                            }}
                            onKeyDown={(e) => {
                              if (approvedMode || !activeBlockId) return;
                              if (e.key === "Enter" || e.key === " ") {
                                setBlocks(arr => arr.map(b =>
                                  b.id === activeBlockId ? { ...b, variant: i } : b
                                ));
                                setVariantForId(null);
                              }
                            }}
                            className={[
                              "w-full overflow-hidden rounded-md border bg-white text-left transition mb-4 box-border ",
                              selected ? "outline outline-2 -outline-offset-2 outline-blue-500 hover:outline-blue-700" : "hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-blue-200"
                            ].join(" ")}
                          >
                            <div className="px-3 pt-2 pb-2 text-xs font-medium text-gray-700">
                              {labels[i] ?? `Variant ${i + 1}`}
                            </div>
                            <Separator />
                            <div className="p-2">
                              <div className="overflow-hidden rounded-md  ">
                                <AutoScaler designWidth={1440} targetWidth={240} maxHeight={520} >
                                  <div data-scope={activeBlock?.type} >
                                    <EditableSection
                                      discoverKey={`${activeBlock?.type}:${i}`}
                                      controls={activeBlock?.controls || {}}
                                      copyValues={activeBlock?.copy || {}}
                                    >
                                      <Preview preview />
                                    </EditableSection>
                                  </div>
                                </AutoScaler>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                {activeBlockId && (

                  <div className="my-3">
                    <Separator className="my-3" />
                    <ScrollArea className="max-h-[60vh] pr-2">
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Display Sections</div>
                        <div className="space-y-2">
                          {partList.length > 0 ? (
                            partList.map((p) => {
                              const controls = activeBlock?.controls || {};
                              const checked = controls[p.id] !== undefined ? controls[p.id] : p.visible;
                              const hideThisSwitch = !checked && p.hideSwitchWhenHidden;

                              if (hideThisSwitch) return null;

                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => !approvedMode && onTogglePartFromSidebar(p.id, !checked)}
                                  onKeyDown={(e) =>
                                    !approvedMode &&
                                    (e.key === "Enter" || e.key === " ") &&
                                    onTogglePartFromSidebar(p.id, !checked)
                                  }
                                >
                                  <span className="truncate">{p.label}</span>
                                  <Switch
                                    checked={checked}
                                    onCheckedChange={(v) => !approvedMode && onTogglePartFromSidebar(p.id, v)}
                                    className="h-4 w-7"
                                    disabled={approvedMode}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-500">No editable parts found in this section.</div>
                          )}
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div>
                        <div className="text-xs font-semibold text-gray-500 my-4 ">Copy</div>
                        {copyList.length > 0 ? (
                          copyList.map((p) => {
                            const current =
                              activeBlock?.copy && typeof activeBlock.copy[p.id] === "string"
                                ? activeBlock.copy[p.id]
                                : p.defaultText;
                            const max = p.maxChars || 120;

                            return (
                              <div key={p.id} className="space-y-1 mb-6 px-1">

                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-medium text-gray-600">{p.label}</label>
                                  <div className="text-right text-[11px] text-gray-400">{current?.length ?? 0}/{max}</div>
                                </div>
                                <input
                                  type="text"
                                  value={current ?? ""}
                                  maxLength={max}
                                  onChange={(e) => !approvedMode && onCopyChangeFromSidebar(p.id, e.target.value)}
                                  className="w-full rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 "
                                  placeholder={`Up to ${max} characters`}
                                  readOnly={approvedMode}
                                />

                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-gray-500">No copy-editable parts in this section.</div>
                        )}
                      </div>
                      <div className="mt-4 mb-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="w-full justify-between">
                              More Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-64">
                            <SectionActionsMenu
                              section={blocks.find(b => b.id === activeBlockId)}

                              onDelete={() => handleDelete(activeBlockId)}
                              onMoveUp={() => handleMoveUp(activeBlockId)}
                              onMoveDown={() => handleMoveDown(activeBlockId)}


                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </ScrollArea>
                  </div>
                )}



              </div>
            </div>

          </aside>


        )}



        {/* Canvas */}
        <main className="flex-1 p-4 flex justify-center box-border">
          <div className="w-full max-w-[800px] box-border">
            <div className="space-y-4">
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
                    <div className="">
                      {blocks.map((b, i) => (
                        <div key={b.id} className="group relative">
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
                                  x.id === b.id
                                    ? { ...x, controls: { ...(x.controls || {}), [partId]: !!nextVisible } }
                                    : x
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
                              setBlocks((arr) =>
                                arr.map((x) => (x.id === b.id ? { ...x, overrides: next } : x))
                              );
                            }}
                            availableThemeKeys={Object.keys(globalTheme.colors)}
                            onRemove={(id) => !approvedMode && setBlocks((arr) => arr.filter((blk) => blk.id !== id))}
                            onVariantPick={(id, variantIndex) =>
                              !approvedMode &&
                              setBlocks((arr) => arr.map((blk) => (blk.id === id ? { ...blk, variant: variantIndex } : blk)))
                            }
                            readOnly={approvedMode}
                            onSelect={() => setActiveBlockId(b.id)}
                            selected={activeBlockId === b.id}
                            variantOpen={variantForId === b.id}
                            onVariantOpenChange={(open) => setVariantForId(open ? b.id : (variantForId === b.id ? null : variantForId))}
                            contentOpen={contentForId === b.id}
                            onContentOpenChange={(open) => setContentForId(open ? b.id : (contentForId === b.id ? null : contentForId))}
                          />
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

            {toast && (
              <div className="fixed bottom-4 right-4 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                {toast}
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
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "hero")}
                  >
                    Hero
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "extraPrizes")}
                  >
                    Extra Prizes
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddSectionAt(picker.index ?? blocks.length, "winners")}
                  >
                    Winners
                  </Button>
                </div>

                <DialogFooter className="mt-2">
                  <Button variant="ghost" onClick={() => setPicker({ open: false, index: null })}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>

      {active && (
        <VariantDock
          open={!!active}
          type={active?.type}
          currentVariant={active?.variant ?? 0}
          onPick={(v) => !approvedMode && setBlocks((arr) => arr.map((b) => (b.id === active.id ? { ...b, variant: v } : b)))}
          onClose={() => { }}
        />
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Approve & hand off to production</DialogTitle>
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
              <Button className="w-full" onClick={submitViaEmail}>
                Submit to Production
              </Button>
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

/* --------------------------- Hooks & Utils ------------------------- */

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