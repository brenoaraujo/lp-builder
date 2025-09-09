import React from "react";
import  EditorSidebar  from "../components/EditorSidebar.jsx";
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
}) {
  const virtualId = React.useMemo(() => `onb_${sectionKey}`, [sectionKey]);
  const variantIndex = variantKey === "B" ? 1 : 0;

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
    setVirtualBlock((b) => ({ ...b, variant: variantKey === "B" ? 1 : 0 }));
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
  const closePanel = () => {};

  const Variants = SECTIONS_REG[sectionKey]?.variants || [];
  const Comp = Variants[virtualBlock.variant] || (() => null);

  return (
    <div className="flex gap-4">
      <EditorSidebar
        activeBlockId={activeBlockId}
        activeBlock={activeBlock}
        partList={partList}
        copyList={copyList}
        approvedMode={approvedMode}
        SECTIONS_REG={SECTIONS_REG}
        closePanel={closePanel}
        handleDelete={() => {}}
        handleMoveUp={() => {}}
        handleMoveDown={() => {}}
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
      />

      <div className="flex-1 p-4">
        <AutoScaler designWidth={1440} targetWidth={720} maxHeight={9999}>
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
  );
}