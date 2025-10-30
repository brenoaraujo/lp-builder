import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ThemeAside from "./ThemeAside.jsx";
import EditorSidebar from "./EditorSidebar.jsx";
import { ChevronDown } from "lucide-react";

export default function LeftSidebar({
    activeBlockId,
    activeBlock,
    partList,
    copyList,
    approvedMode,
    SECTIONS_REG,
    closePanel,
    handleDelete,
    handleMoveUp,
    handleMoveDown,
    onTogglePartFromSidebar,
    onCopyChangeFromSidebar,
    variantIndex,
    setVariantForId,
    variantForId,
    setBlocks,
    blocks,
    setNavbarOverrides,
    setFooterOverrides,
    setBlockOverrides,
    images,
    onImageChange,
    globalColors,
    // Theme props
    onColorsChange,
    onFontsChange,
    inviteToken,
    inviteRow,
    onUpdateInvite,
    currentGlobalColors,
    sectionOverrides,
}) {
    // Determine which accordion should be open
    const activeAccordion = activeBlockId ? "editor" : "colors";

    // Handle accordion value change
    const handleAccordionChange = (value) => {
        if (value === "colors" && activeBlockId) {
            // If clicking colors when section is selected, deselect the section
            closePanel();
        } else if (value === "editor" && !activeBlockId) {
            // If clicking editor when no section selected, do nothing (stay on colors)
            return;
        } else if (value === "editor" && activeBlockId) {
            // If clicking editor when section is already selected, deselect the section and switch to colors
            closePanel();
        } else if (value === "" && activeBlockId) {
            // If clicking on an already open accordion (closing it), deselect the section
            closePanel();
        }
    };

    return (
        <div
            className="w-[320px] flex-shrink-0 min-h-0"
        >
            <div
                className="rounded-lg border border-slate-200 shadow-lg overflow-auto sticky"
                style={{ top: "calc(var(--header-h, 12px) + 12px)", maxHeight: "calc(100vh - var(--header-h, 56px) - 24px - 130px)" }}
            >
                <Accordion type="single" value={activeAccordion} onValueChange={handleAccordionChange} collapsible className="w-full">
                    {/* Theme Colors Accordion */}
                    <AccordionItem value="colors" className="border-b">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-gray-700 hover:no-underline cursor-pointer">
                            Theme Colors
                        </AccordionTrigger>
                        <AccordionContent className="px-0">
                            <ThemeAside
                                onColorsChange={onColorsChange}
                                onFontsChange={onFontsChange}
                                inviteToken={inviteToken}
                                inviteRow={inviteRow}
                                onUpdateInvite={onUpdateInvite}
                                currentGlobalColors={currentGlobalColors}
                                sectionOverrides={sectionOverrides}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Section Editor Accordion */}
                    <AccordionItem value="editor" className="border-b-0">
                        <div className="px-4 pb-0">
                            {activeBlockId ? (
                                <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline w-full text-left cursor-pointer">
                                    Section Editor
                                </AccordionTrigger>
                            ) : (
                                <div className="text-sm font-semibold pt-4 pb-2 text-gray-700">
                                    Section Editor
                                </div>
                            )}
                            {!activeBlockId && (
                                <p className="text-xs text-gray-500 pb-4  ml-0">
                                    Choose a section from the preview to make changes.
                                </p>
                            )}
                        </div>
                        <AccordionContent className="px-0">
                            {activeBlockId && (
                                <EditorSidebar
                                    activeBlockId={activeBlockId}
                                    activeBlock={activeBlock}
                                    partList={partList}
                                    copyList={copyList}
                                    approvedMode={approvedMode}
                                    SECTIONS_REG={SECTIONS_REG}
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
                                    setNavbarOverrides={setNavbarOverrides}
                                    setFooterOverrides={setFooterOverrides}
                                    setBlockOverrides={setBlockOverrides}
                                    images={images}
                                    onImageChange={onImageChange}
                                    mode="builder"
                                    globalColors={globalColors}
                                    staticLayout={true}
                                    inviteRow={inviteRow}
                                />
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
