// src/components/SectionActionsMenu.jsx
// Minimal, safe menu that only calls the handlers you pass in.
// It does NOT try to render previews or use SortableBlock internals.

import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";

const isOnboarding =
  typeof window !== "undefined" && window.location.hash.includes("/onboarding");

export default function SectionActionsMenu({
    section,                 // The selected block object (can be null)
    onDuplicate,             // () => void
    onDelete,                // () => void
    onMoveUp,                // () => void
    onMoveDown,              // () => void
    onToggleVisibility,      // () => void (toggles hidden/shown)
    // Optional callbacks — only if you wire them from App later:
    onOpenVariantPicker,     // () => void (open the same change layout UI in-place)
    onOpenContentEditor,     // () => void (open the same content editor in-place)
}) {
    const hasSection = !!section;

    return (
        <>
        
            <DropdownMenuGroup>
                {/* If later you want the *exact same* popovers to open inside the selected block,
           wire these to trigger the same state you use in SortableBlock and pass them in as props. */}
                
                <DropdownMenuItem disabled={!hasSection} onClick={() => onMoveUp?.()}>
                    Move Up
                </DropdownMenuItem>

                <DropdownMenuItem disabled={!hasSection} onClick={() => onMoveDown?.()}>
                    Move Down
                </DropdownMenuItem>

                

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={!hasSection}
                    onClick={() => onDelete?.()}
                    className="text-red-600 focus:text-red-600"
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}