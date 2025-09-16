import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, Plus, ChevronDown, ArrowRight, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import AutoScaler from "@/components/AutoScaler.jsx";
import EditableSection from "@/components/EditableSection.jsx";
import SectionActionsMenu from "./SectionActionsMenu.jsx";

/* ------------------------------------------------------------------ */
/* Left Sidebar (reused in onboarding)                                */
/* ------------------------------------------------------------------ */

export default function EditorSidebar({
  activeBlockId, activeBlock, partList, copyList,
  approvedMode, SECTIONS_REG = SECTIONS,
  closePanel, handleDelete, handleMoveUp, handleMoveDown,
  onTogglePartFromSidebar, onCopyChangeFromSidebar,
  variantIndex, setVariantForId, variantForId, setBlocks, blocks,
  mode = "builder",
  hideVariantPicker = false,
  hideAdvancedActions = false,
  staticLayout = false,
  hideCloseAction = false,
  onSaveNext,
}) {

  // Close on Escape (but don't trigger while typing in inputs/textareas)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      const isTyping =
        t && (
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable
        );
      if (isTyping) return;
      e.preventDefault();
      closePanel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel]);


  const activeEntry = activeBlock ? SECTIONS_REG[activeBlock.type] : null;
const getControlChecked = (part) => {
  const v = activeBlock?.controls?.[part.id];
  return typeof v === "boolean" ? v : (part.visible !== false);
};

// Read one control flag, defaulting to ON when undefined
const isControlOn = (id, defaultOn = true) => {
  const v = activeBlock?.controls?.[id];
  return typeof v === "boolean" ? v : defaultOn;
};

/**
 * Copy item visibility:
 * 1) If copy item declares a controlling id (displayId/visibleIfId/controlId), use it.
 * 2) Else: if any OFF control id is a prefix of the copy id, hide it (e.g., "buyButton" → hides "buyButtonText").
 * 3) Else: if an exact OFF exists for this id, hide it.
 * 4) Else: fall back to the part's default visibility (if found in partList).
 */
const isCopyVisible = (copyItem) => {
  const controls = activeBlock?.controls || {};
  const controlId = copyItem.displayId || copyItem.visibleIfId || copyItem.controlId;

  if (controlId) return isControlOn(controlId, true);

  for (const key in controls) {
    if (controls[key] === false && String(copyItem.id).startsWith(String(key))) return false;
  }
  if (controls.hasOwnProperty(copyItem.id) && controls[copyItem.id] === false) return false;

  const part = Array.isArray(partList) ? partList.find(p => p.id === copyItem.id) : null;
  if (part) return part.visible !== false;

  return true;
};

// Filtered copy list used by the "Copy" panel
const visibleCopyList = Array.isArray(copyList) ? copyList.filter((p) => isCopyVisible(p)) : [];


  return (
    <aside className={
      staticLayout
        ? "h-full w-[280px] overflow-hidden rounded-xl bg-slate-50 border border-slate-200"
        : "fixed left-4 top-18 z-40 w-[290px] overflow-hidden rounded-md border bg-white shadow-lg"
    }
    >
      <div className={staticLayout
        ? "flex h-full flex-col overflow-hidden overscroll-contain"
        : "flex h-[calc(100vh-6rem)] flex-col overflow-hidden overscroll-contain"
      }>
        {!hideVariantPicker && (
          <div className="shrink-0 p-4 pb-0 flex items-center justify-between">
            <div className="text-md font-semibold text-gray-700 mb-4">Section</div>
            <button
              type="button"
              onClick={closePanel}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === " ") {
                  e.preventDefault(); // optional: prevents page scroll on space
                  closePanel();
                }
              }}
              className="rounded p-1 hover:bg-gray-100"
              aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <ScrollArea type="hover" className="h-full min-h-0 p-4" >
            <div className="space-y-2">
              {/* Layout picker */}
              {!hideVariantPicker && (
                <>
                  <div className="text-xs font-semibold text-gray-500 mb-2">Layout</div>
                  <Popover open={variantForId === activeBlockId} onOpenChange={(open) => setVariantForId(open ? activeBlockId : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-gray-500 mb-4"
                        disabled={approvedMode || !activeBlockId}
                      >
                        {activeEntry?.labels?.[variantIndex] ?? `${activeEntry?.label ?? "Variant"} ${variantIndex + 1}`}
                        <ArrowRight />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      side="right" align="start" sideOffset={8}
                      className="z-[9999] w-[300px] p-0 rounded-xl bg-white shadow-lg p-2"
                    >
                      <div className="px-3 py-2 text-sm font-semibold">Replace Component</div>

                      {(SECTIONS_REG[activeBlock?.type]?.variants || []).map((Preview, i) => {
                        const labels = SECTIONS_REG[activeBlock?.type]?.labels || [];
                        const selected = (activeBlock?.variant ?? 0) === i;
                        return (
                          <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (approvedMode || !activeBlockId) return;
                              setBlocks(arr => arr.map(b => (b.id === activeBlockId ? { ...b, variant: i } : b)));
                              setVariantForId(null);
                            }}
                            onKeyDown={(e) => {
                              if (approvedMode || !activeBlockId) return;
                              if (e.key === "Enter" || e.key === " ") {
                                setBlocks(arr => arr.map(b => (b.id === activeBlockId ? { ...b, variant: i } : b)));
                                setVariantForId(null);
                              }
                            }}
                            className={[
                              "w-full overflow-hidden rounded-md border bg-white text-left transition mb-4",
                              selected
                                ? "outline outline-2 -outline-offset-2 outline-blue-500 hover:outline-blue-700"
                                : "hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-blue-200",
                            ].join(" ")}
                          >
                            <div className="px-3 pt-2 pb-2 text-xs font-medium text-gray-700">
                              {labels[i] ?? `Variant ${i + 1}`}
                            </div>
                            <Separator />
                            <div className="p-2">
                              <div className="overflow-hidden rounded-md">
                                <AutoScaler designWidth={1440} targetWidth={240} maxHeight={520}>
                                  <div data-scope={activeBlock?.type}>
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

                    </PopoverContent>
                  </Popover>
                </>
              )}

              {/* Display toggles */}
              {!hideVariantPicker && (<Separator className="my-3" />)}

              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Display Sections</div>
                <div className="space-y-2">
                  {partList.length > 0 ? (
                    partList.map((p) => {
                      const checked = getControlChecked(p);               // ✅ uses default when undefined
                      if (!checked && p.hideSwitchWhenHidden) return null;

                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                          role="button"
                          tabIndex={0}
                          onClick={() => !approvedMode && onTogglePartFromSidebar(p.id, !checked)}
                          onKeyDown={(e) =>
                            !approvedMode && (e.key === "Enter" || e.key === " ") && onTogglePartFromSidebar(p.id, !checked)
                          }
                          aria-pressed={checked}
                        >
                          <span className="truncate">{p.label}</span>
                          <Switch
                            checked={checked}
                            onCheckedChange={(v) => !approvedMode && onTogglePartFromSidebar(p.id, v)}
                            className="h-4 w-7"
                            disabled={approvedMode}
                            onClick={(e) => e.stopPropagation()} // prevent double-toggle via row click
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

              {/* Copy edits */}
              <div>
                <div className="text-xs font-semibold text-gray-500 my-4">Copy</div>
                {visibleCopyList.length > 0 ? (
                  visibleCopyList.map((p) => {
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
                          className="w-full rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* More actions */}
              {!hideAdvancedActions && (
                <>
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
                </>
              )}

            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
        {/* Onboarding-only action */}
        {mode === "onboarding" && typeof onSaveNext === "function" && (
          <div className="shrink-0 border-t bg-slate-50 p-3">
            <Button className="w-full" onClick={onSaveNext}>Save & Next</Button>
          </div>
        )}
      </div>
    </aside>
  );
}
