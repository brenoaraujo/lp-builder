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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Icons
import { Plus, ChevronDown } from "lucide-react";

// UI
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";

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
// === PRODUCTION EMAIL (set this!)
const PRODUCTION_EMAIL = "baraujo@ascendfs.com"; // <— change me to your team's email

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

// VERCEL RESEND HANDOFF
// pack/unpack snapshot so URL carries BOTH blocks + globalTheme
function packSnapshot(blocks, globalTheme) {
  return { blocks, globalTheme };
}
function unpackSnapshot(payload) {
  // backward compatible: older links might just be an array
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
  availableKeys = [],
  title = "Enable Color Overrides",
  readOnly = true,
}) {
  const enabled = !!overrides.enabled;

  // single-palette (non-hero)
  const values = overrides.values || {};
  // extra PP palette only for hero
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
          Custom Colors <ChevronDown/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="bottom" align="end" sideOffset={8}>


        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{title}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={readOnly} />
        </div>

        {/* Main palette */}
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

// approval + handoff modal

function ApproveHandoffModal({ open, onClose, onSubmit, defaults }) {
  const [company, setCompany] = useState(defaults?.company || "");
  const [project, setProject] = useState(defaults?.project || "");
  const [approverName, setApproverName] = useState(defaults?.approverName || "");
  const [approverEmail, setApproverEmail] = useState(defaults?.approverEmail || "");
  const [notes, setNotes] = useState(defaults?.notes || "");

  useEffect(() => {
    if (!open) return;
    // hydrate when opening
    setCompany(defaults?.company || "");
    setProject(defaults?.project || "");
    setApproverName(defaults?.approverName || "");
    setApproverEmail(defaults?.approverEmail || "");
    setNotes(defaults?.notes || "");
  }, [open]); // eslint-disable-line

  const canSubmit =
    company.trim() &&
    project.trim() &&
    approverName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(approverEmail);

  const submit = () => {
    if (!canSubmit) return;
    const payload = { company: company.trim(), project: project.trim(), approverName: approverName.trim(), approverEmail: approverEmail.trim(), notes: notes.trim() };
    // remember approver locally for next time
    try {
      localStorage.setItem("lpb.approver.defaults", JSON.stringify({
        company: payload.company,
        project: payload.project,
        approverName: payload.approverName,
        approverEmail: payload.approverEmail,
        notes: "", // don't persist notes by default
      }));
    } catch { }
    onSubmit?.(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="w-[520px] max-w-[95vw] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Approve & hand off to production</DialogTitle>
          <DialogDescription className="sr-only">
            Finalize this design and send details to production via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium">Company name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Inc."
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium">Project name</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LP – Spring Campaign"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium">Approver name</label>
            <input
              type="text"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium">Approver email</label>
            <input
              type="email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jane@acme.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Anything your production team should know…"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Submit to production
          </Button>
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

  // Local list of copy-editable parts for the Edit popover
  const [copyParts, setCopyParts] = useState([]);

  // Ensure `parts` is an array
  const listParts = Array.isArray(parts)
    ? parts
    : parts && typeof parts === "object"
      ? Object.values(parts)
      : [];

  // Build override styles
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
      className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            {...(!readOnly ? { ...attributes, ...listeners } : {})}
            className={[
              "rounded-md px-2 py-1",
              readOnly ? "cursor-default text-gray-300" : "cursor-grab hover:bg-gray-100 active:cursor-grabbing",
            ].join(" ")}
            title={readOnly ? undefined : "Drag to reorder"}
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
              <Button variant="ghost" size="sm" className="text-gray-700" disabled={readOnly}>
                Change Layout <ChevronDown/>
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
                      onClick={() => !readOnly && onVariantPick(id, i)}
                      onKeyDown={(e) =>
                        !readOnly && (e.key === "Enter" || e.key === " ") && onVariantPick(id, i)
                      }
                      className={[
                        "w-full max-w-full overflow-hidden rounded-xl border bg-white text-left transition",
                        i === safeIndex ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white" : "hover:bg-gray-50",
                        readOnly ? "pointer-events-none opacity-70" : "",
                      ].join(" ")}
                    >
                      <div className="px-3 pt-2 text-xs font-medium text-gray-700">
                        {labels[i] ?? `Variant ${i + 1}`}
                      </div>
                      <div className="p-2">
                        <div className="overflow-hidden rounded-lg">
                          <AutoScaler designWidth={1440} targetWidth={280} maxHeight={520}>
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
              <Button variant="ghost" size="sm" className="text-gray-700" disabled={readOnly}>
                Edit Content <ChevronDown/>
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
                            onChange={(e) => !readOnly && onCopyChange(p.id, e.target.value)}
                            className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Up to ${max} characters`}
                            readOnly={readOnly}
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
            overrides={overrides || { enabled: false, values: {}, valuesPP: {} }}
            onSetOverrides={onSetOverrides}
            availableKeys={availableThemeKeys}
            readOnly={readOnly}
          />

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700"
            onClick={() => onRemove(id)}
            disabled={readOnly}
          >
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
  // Hydration guard so effects don’t race while parsing incoming hash
  const [hydrated, setHydrated] = useState(false);

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
  //approval + handoff modal
  const [handoffOpen, setHandoffOpen] = useState(false);

  // Load saved defaults for approver/company/project (nice UX)
  const [handoffDefaults, setHandoffDefaults] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lpb.approver.defaults");
      if (saved) setHandoffDefaults(JSON.parse(saved));
    } catch { }
  }, []);

  const submitHandoff = (formData) => {
    // Ensure the current URL hash matches the *latest* state (so snapshot is immutable)
    try {
      // If you already persist on every change, this is just a nudge:
      const payload = encodeState(blocks); // if your share includes theme too, keep your existing routine here
      location.hash = payload;
      history.replaceState(null, "", `#${payload}`);
    } catch { }

    const url = location.href; // current immutable snapshot
    const mailto = buildApprovalMailto(PRODUCTION_EMAIL, { ...formData, url });

    try {
      window.location.href = mailto; // open email client
    } catch {
      // ultra fallback: copy to clipboard
      navigator.clipboard?.writeText(`${formData.company} / ${formData.project}\n${url}`);
    }

    setHandoffOpen(false);
  };

  // Apply global variables to :root
  useEffect(() => {
    setCSSVars(document.documentElement, "colors", globalTheme.colors);
  }, [globalTheme]);

  // --- Read-only / Approved snapshot detection ---
  const [approvedMeta, setApprovedMeta] = useState(null); // {approved, approvedAt, projectId?, customerName?}
  const approvedMode = !!approvedMeta?.approved;

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event) => {
    if (approvedMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    setBlocks((arr) => arrayMove(arr, oldIndex, newIndex));
  };

  // Load from URL hash (supports both legacy and new snapshot object)
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


    // Legacy: just an array of blocks
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

    // New snapshot format: { blocks, globalTheme?, meta? }
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
        setGlobalTheme({ colors: { ...loaded.globalTheme.colors } });
      }
      if (loaded.meta?.approved) {
        setApprovedMeta({ ...loaded.meta });
      }
    }
    setHydrated(true);
  }, []);

  // Persist (editor mode only; not for approved read-only)
  useEffect(() => {
    if (!hydrated || approvedMode) return;
    const payload = encodeState(packSnapshot(blocks, globalTheme));
    history.replaceState(null, "", `#${payload}`);
  }, [blocks, globalTheme, hydrated, approvedMode]);

  // Share (editor mode)
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

  // Reset to defaults (editor mode only)
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
    const payload = encodeState({ blocks: [], globalTheme: { colors: {} } }); // clear-ish hash
    history.replaceState(null, "", `#${payload}`);
    setToast("Reset to defaults");
    clearTimeout(window.__share_toast_timer);
    window.__share_toast_timer = setTimeout(() => setToast(null), 1600);
  };

  // ---- Approve flow (immutable snapshot) ----
  // —— Approve / Handoff state ——
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalLink, setApprovalLink] = useState("");

  const [approvalMeta, setApprovalMeta] = useState({
    customerName: "",
    projectId: "",
    notes: "",
    approverName: "",
    approverEmail: "",
  });


  // Submit to production via serverless email (Resend)
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
        // show the reason if available
        const reason = data?.error ? `${data.error} ${data?.missing ? `(${data.missing.join(", ")})` : ""}` : "Unknown error";
        // setToast(`Submit failed: ${reason}`);
        return;
      }

      // setToast("Submitted to production ✅");
      setApproveOpen(false);
    } catch (err) {
      console.error(err);
      // setToast("Submit failed. Try again.");
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
    // we do NOT change the current page to read-only; the approval link itself is immutable
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

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
                    // export the approved snapshot you’re viewing
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
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-gray-700">Sections</div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => !approvedMode && setBlocks((arr) => [...arr, { id: uid(), type: "hero", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }])} disabled={approvedMode}>
                <Plus /> Hero
              </Button>
              {/*<Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => !approvedMode && setBlocks((arr) => [...arr, { id: uid(), type: "pricing", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }])} disabled={approvedMode}>
                <Plus /> Pricing
              </Button>
              <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => !approvedMode && setBlocks((arr) => [...arr, { id: uid(), type: "testimonials", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }])} disabled={approvedMode}>
                <Plus /> Testimonials
              </Button>*/}
              <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => !approvedMode && setBlocks((arr) => [...arr, { id: uid(), type: "extraPrizes", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }])} disabled={approvedMode}>
                <Plus /> Extra Prizes
              </Button>
              <Button variant="outline" className="w-full justify-start text-gray-500" onClick={() => !approvedMode && setBlocks((arr) => [...arr, { id: uid(), type: "winners", variant: 0, controls: {}, copy: {}, overrides: { enabled: false, values: {}, valuesPP: {} } }])} disabled={approvedMode}>
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
          onPick={(v) => !approvedMode && setBlocks((arr) => arr.map((b) => (b.id === active.id ? { ...b, variant: v } : b)))}
          onClose={() => { }}
        />
      )}

      {/* Approve modal */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Approve & hand off to production</DialogTitle>
            <DialogDescription className="sr-only">
              Finalize this design and send details to production via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Who’s approving */}

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


            {/* Company / project */}

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

            {/* Notes */}
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

            {/* Submit */}
            <div className="pt-2">
              <Button className="w-full" onClick={submitViaEmail}>
                Submit to Production
              </Button>
            </div>

            {/* FYI: show generated link (readonly) after submit or on demand */}
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

// Simple element width hook (kept for completeness if not already in your project)
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

