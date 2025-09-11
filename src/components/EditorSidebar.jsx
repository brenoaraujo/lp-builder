import React from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}) {
  const activeEntry = activeBlock ? SECTIONS_REG[activeBlock.type] : null;

  return (
   <aside
     className={
       staticLayout
         ? "w-[280px] rounded-xl bg-slate-50 border border-slate-200  p-6"
         : "fixed left-4 top-18 z-40 w-[290px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md border bg-white shadow-lg p-4"
     }
   >
    {!hideVariantPicker && (
      <div className="flex items-center justify-between">
        <div className="text-md font-semibold text-gray-700 mb-4">Section</div>
        <button type="button" onClick={closePanel} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
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
                <ScrollArea className="h-[60vh] p-3">
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
                </ScrollArea>
            </PopoverContent>
            </Popover>
            </>
        )}

        {/* Display toggles */}
        {!hideVariantPicker && (<Separator className="my-3" />)}
        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">Display Sections</div>
            <div className="space-y-2">
              {partList.length > 0 ? (
                partList.map((p) => {
                  const controls = activeBlock?.controls || {};
                  const checked = controls[p.id] !== undefined ? controls[p.id] : p.visible;
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

          {/* Copy edits */}
          <div>
            <div className="text-xs font-semibold text-gray-500 my-4">Copy</div>
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
        </ScrollArea>
       
      </div>
    </aside>
  );
}
