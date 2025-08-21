import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { HeroA, HeroB } from "./sections/Hero.jsx";
import { PricingA, PricingB } from "./sections/Pricing.jsx";
import { TestimonialsA, TestimonialsB } from "./sections/Testimonials.jsx";
import { ExtraPrizesA, ExtraPrizesB } from "./sections/ExtraPrizes.jsx";


// DnD Kit imports
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// UI components
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

// AutoScaler for previews
import AutoScaler from "@/components/AutoScaler";
import useElementWidth from "@/hooks/useElementWidth";
import EditableSection from "@/components/EditableSection";


const pruneControls = (controls = {}, partsList) => {

  const arr = Array.isArray(partsList)
    ? partsList
    : partsList && typeof partsList === "object"
      ? Object.values(partsList)
      : [];

  const allow = new Set(arr.map((p) => p?.id).filter(Boolean));
  return Object.fromEntries(
    Object.entries(controls || {}).filter(([k]) => allow.has(k))
  );
};



// --- URL state encoding helpers (safe base64, no deps) ---
function encodeState(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  // URL-safe base64 (no + / or trailing =)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeState(s) {
  try {
    // restore padding & chars
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const json = decodeURIComponent(escape(atob(s)));
    return JSON.parse(json);
  } catch (e) {
    console.warn("Failed to decode state from URL:", e);
    return null;
  }
}

/* ---------- Variants Menu ---------- */
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
};

// id helper
const uid = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now();

/* ---------- Variant Dock (Tailwind-only) ---------- */
function VariantDock({ open, type, currentVariant, onPick, onClose }) {
  const entry = SECTIONS[type]
  if (!entry) return null

  const { variants, labels } = entry
  const safeIndex = Math.min(Math.max(0, currentVariant ?? 0), variants.length - 1)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
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
                    <VariantComp preview /> {/* pass preview to disable heavy features */}
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
  )
}

// -------- SortableBlock (drop-in) --------
function SortableBlock({
  id,
  type,
  variant,
  controls,
  parts,                 // <--- use parts from App
  onPartsDiscovered,     // <--- handler from App
  onTogglePart,
  onRemove,
  onVariantPick,
}) {
  // ⬅️ THIS LINE defines setNodeRef (and friends)
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
    variants[safeIndex] ||
    (() => <div className="rounded border p-4 text-sm">Missing variant</div>);
  const headerLabel = `${entry.label} — ${labels[safeIndex] ?? `Variant ${safeIndex + 1}`
    }`;

  // Measure available width to scale the 1440px sections on the canvas
  const contentRef = useRef(null);
  const contentWidth = useElementWidth(contentRef);
  const targetWidth = Math.max(320, Math.min(1440, contentWidth || 0));





  const onDiscover = useCallback(
    (found) => {
      setParts(found);
      onPartsDiscovered?.(id, found);  // <-- tell parent; no setBlocks here
    },
    [id, onPartsDiscovered]
  );



  return (
    <div
      ref={setNodeRef}                // ⬅️ uses setNodeRef from useSortable
      style={style}
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
          {/* Change variant */}
          <Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm" className="text-blue-600">
      Change variant
    </Button>
  </PopoverTrigger>

  {/* 1) Clamp the popover size + hide overflow */}
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

  {/* 👇 fixed height + overflow-y-auto makes it scroll */}
 <ScrollArea className="h-[60vh]  bg-white box-border ">
    <div className="space-y-6 p-6 box-border" >
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

          {/* Keep the preview comfortably inside the popover */}
          <div className="p-2">
            <div className="overflow-hidden rounded-lg">
              <AutoScaler designWidth={1440} targetWidth={280} maxHeight={520}>
                <EditableSection controls={controls}>
                  <Preview />
                </EditableSection>
              </AutoScaler>
            </div>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
</PopoverContent>
</Popover>
          {/* Edit variant */}
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
                <div className="space-y-2">
                  {parts.length === 0 ? (
                    <div className="text-xs text-gray-500">No editable parts found in this section.</div>
                  ) : (
                    parts.map((p) => {
                      const current = controls[p.id];                 // boolean | undefined
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
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => onRemove(id)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Canvas content */}
      <div ref={contentRef}>
        <AutoScaler designWidth={1440} targetWidth={targetWidth} maxHeight={9999}>
          <EditableSection id={id} controls={controls} onPartsDiscovered={(found) => onPartsDiscovered && onPartsDiscovered(found)}>
            <Comp />
          </EditableSection>
        </AutoScaler>
      </div>
    </div>
  );
}
/* ---------- App (multiple blocks, no DnD yet) ---------- */
export default function App() {
  // Store a list of blocks: { id, type, variant }
  const [blocks, setBlocks] = useState([
    { id: uid(), type: "hero", variant: 0, controls: {} },
  ]);

  // Which block (by id) has its VariantDock open
  const [dockBlockId, setDockBlockId] = useState(null);

  const addBlock = (type, variant = 0) =>
    setBlocks((arr) => [...arr, { id: uid(), type, variant, controls: {} }]);

  const removeBlock = (id) =>
    setBlocks((arr) => arr.filter((b) => b.id !== id));

  const setVariant = (id, variantIndex) =>
    setBlocks((arr) =>
      arr.map((b) => (b.id === id ? { ...b, variant: variantIndex } : b))
    );

  const active = blocks.find((b) => b.id === dockBlockId) || null;
  const [toast, setToast] = useState(null);
  // Drag sensors (small movement threshold prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Prune controls whenever a block reports its editable parts
  const [partsByBlock, setPartsByBlock] = useState({});

  const handlePartsDiscovered = useCallback((blockId, parts) => {
    // store parts for this block (for the Edit dock UI)
    setPartsById((prev) => ({ ...prev, [blockId]: parts }));
    // prune controls so we only keep keys that still exist
    setBlocks((arr) =>
      arr.map((b) =>
        b.id === blockId ? { ...b, controls: pruneControls(b.controls || {}, parts) } : b
      )
    );
  }, []);



  // Reorder on drop
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    setBlocks((arr) => arrayMove(arr, oldIndex, newIndex));
  };
  useEffect(() => {
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : "";
    if (!hash) return;
    const loaded = decodeState(hash);
    if (Array.isArray(loaded)) {
      setBlocks(
        loaded.map((b) => ({
          id: b.id,
          type: b.type,
          variant: Number.isInteger(b.variant) ? b.variant : 0,
          controls: b.controls || {},            // <-- ensure present
        }))
      );
    }
  }, []);
  const share = async () => {
    const payload = encodeState(blocks);              // blocks = your page state
    const url = `${location.origin}${location.pathname}#${payload}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Share link copied to clipboard");
    } catch {
      setToast("Copy failed — URL placed in address bar");
    }
    history.replaceState(null, "", `#${payload}`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-semibold tracking-tight text-gray-900">
            LP Builder — Multiple Blocks
          </h1>

          <div className="flex items-center gap-2">
            {/* Add buttons (we only have Hero variants for now) */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={share}>
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar (reserved for future: categories, search, etc.) */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-gray-700">Sections</div>
            <div className="space-y-2">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addBlock("hero", 0)}
                >
                  ➕ Hero
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addBlock("pricing", 0)}

                >
                  ➕ Pricing
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addBlock("testimonials", 0)}

                >
                  ➕ Testimonials
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addBlock("extraPrizes", 0)}

                >
                  ➕ Extra Prizes
                </Button>
              </div>
              {/* When you add Pricing/Testimonials, add their buttons here */}
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
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {blocks.map((b) => (
                      <SortableBlock
                        key={b.id}
                        id={b.id}
                        type={b.type}
                        variant={b.variant ?? 0}
                        controls={b.controls || {}}


                        parts={partsByBlock[b.id] || []}


                        onPartsDiscovered={(found) => {
                          const safe = Array.isArray(found) ? found : [];

                          setPartsByBlock((prev) => ({ ...prev, [b.id]: safe }));

                          setBlocks((arr) =>
                            arr.map((x) =>
                              x.id === b.id ? { ...x, controls: pruneControls(x.controls, safe) } : x
                            )
                          );
                        }}


                        onTogglePart={(partId, nextVisible) => {
                          setBlocks((arr) =>
                            arr.map((x) =>
                              x.id === b.id
                                ? { ...x, controls: { ...(x.controls || {}), [partId]: !!nextVisible } }
                                : x
                            )
                          );
                        }}

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

      {/* Variant Dock (opens for the clicked block) */}
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