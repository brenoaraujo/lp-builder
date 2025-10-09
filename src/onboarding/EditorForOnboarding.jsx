import React from "react";
import EditorSidebar from "../components/EditorSidebar.jsx";
import { SECTIONS } from "../sections/registry.js";

import { X, Plus, ChevronDown, ArrowRight, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import AutoScaler from "../components/AutoScaler.jsx";
import EditableSection from "../components/EditableSection.jsx";

export default function EditorForOnboarding({
  sectionKey,
  variantKey = "A",
  overrides = {},
  onTogglePart,
  onCopyChange,
  onImageChange,
  images = {},
  onSaveNext,
  hideHiddenCopy = false,
}) {




  const display = overrides?.display || {};
  const copy = overrides?.copy || {};

  const copyObj = overrides?.copy || {};
  const isVisible = (id) => display[id] !== false;

  // Measure the preview column so thumbnails scale to available width
  const previewRef = React.useRef(null);
  const previewWidth = useElementWidth(previewRef);
  const targetWidth = Math.max(360, Math.min(1440, previewWidth || 0));

  const virtualId = React.useMemo(() => `onb_${sectionKey}`, [sectionKey]);
  const variantIndex = variantKey === "B" ? 1 : variantKey === "C" ? 2 : 0;

  const [virtualBlock, setVirtualBlock] = React.useState(() => ({
    id: virtualId,
    type: sectionKey,
    variant: variantIndex,
    controls: overrides?.display || {},
    copy: overrides?.copy || {},
    overrides: overrides?.theme || { enabled: false, values: {}, valuesPP: {} },
  }));

  const [partList, setPartList] = React.useState([]);
  const [copyList, setCopyList] = React.useState([]);

  React.useEffect(() => {
    setVirtualBlock((b) => ({ ...b, variant: variantKey === "B" ? 1 : variantKey === "C" ? 2 : 0 }));
  }, [variantKey]);

  const _onTogglePart = React.useCallback((id, v) => {
    onTogglePart?.(id, v);
    setVirtualBlock((b) => ({ ...b, controls: { ...(b.controls || {}), [id]: !!v } }));
  }, [onTogglePart]);

  const _onCopyChange = React.useCallback((id, text) => {
    onCopyChange?.(id, text);
    setVirtualBlock((b) => ({ ...b, copy: { ...(b.copy || {}), [id]: text } }));
  }, [onCopyChange]);

  const [variantForId, setVariantForId] = React.useState(null);
  const activeBlockId = virtualId;
  const activeBlock = virtualBlock;
  const SECTIONS_REG = SECTIONS;
  const approvedMode = false;
  const closePanel = () => { };

  // For dynamic extra content sections, use the feature section variants
  let Variants, Comp;
  if (sectionKey.startsWith('extraContent_')) {
    Variants = SECTIONS_REG.feature?.variants || [];
    Comp = Variants[virtualBlock.variant] || (() => null);
  } else {
    Variants = SECTIONS_REG[sectionKey]?.variants || [];
    Comp = Variants[virtualBlock.variant] || (() => null);
  }

  return (
    <div className="flex flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
      <div className="lg:h-full lg:min-h-0">
        <EditorSidebar
          activeBlockId={activeBlockId}
          activeBlock={activeBlock}
          partList={partList}
          copyList={copyList}
          approvedMode={approvedMode}
          SECTIONS_REG={SECTIONS_REG}
          closePanel={closePanel}
          handleDelete={undefined}
          handleMoveUp={undefined}
          handleMoveDown={undefined}
          onTogglePartFromSidebar={_onTogglePart}
          onCopyChangeFromSidebar={_onCopyChange}
          variantIndex={virtualBlock.variant}
          setVariantForId={setVariantForId}
          variantForId={variantForId}
          setBlocks={(updater) => {
            setVirtualBlock((prev) => {
              const next = typeof updater === "function" ? updater([prev])[0] : updater;
              return next || prev;
            });
          }}
          blocks={[virtualBlock]}
          images={images}
          onImageChange={onImageChange}
          previewRef={previewRef}
          mode="onboarding"
          hideVariantPicker
          hideAdvancedActions
          staticLayout
          hideCLoseAction
          onSaveNext={onSaveNext}
        />
      </div>
      <div className="lg:h-full lg:min-h-0">
        <div className="h-96 lg:h-full w-full rounded-lg border border-slate-200 bg-white shadow-lg p-4">
          <div ref={previewRef}>
            <AutoScaler designWidth={1440} targetWidth={targetWidth}>
              <div data-scope={sectionKey}>
                <EditableSection
                  discoverKey={`onb:${sectionKey}:${virtualBlock.variant}`}
                  controls={virtualBlock.controls}
                  copyValues={virtualBlock.copy}
                  onPartsDiscovered={(found) => {
                    const arr = Array.isArray(found)
                      ? found
                      : found && typeof found === "object"
                        ? Object.values(found)
                        : [];
                    setPartList(arr);
                  }}
                  onCopyDiscovered={(found) => {
                    const arr = Array.isArray(found)
                      ? found
                      : found && typeof found === "object"
                        ? Object.values(found)
                        : [];
                    setCopyList(arr);
                  }}
                >
                  <Comp />
                </EditableSection>
              </div>
            </AutoScaler>
          </div>
        </div>
      </div>
    </div>
  );
}
// Local width hook (same logic you used in the builder)
function useElementWidth(ref) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => setW(ref.current?.clientWidth || 0));
    ro.observe(ref.current);
    setW(ref.current?.clientWidth || 0);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}