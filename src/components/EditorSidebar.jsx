import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
// removed internal ScrollArea to avoid double scroll; the parent sidebar scrolls
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { X, Plus, ChevronDown, ArrowRight, Pencil, Palette, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import AutoScaler from "@/components/AutoScaler.jsx";
import EditableSection from "@/components/EditableSection.jsx";
import SectionActionsMenu from "./SectionActionsMenu.jsx";
import ImageManager from "./ImageManager.jsx";
import { buildThemeVars, readTokenDefaults, setCSSVars, setCSSVarsImportant, readThemeMode, resolvePalette } from "../theme-utils.js";
import { supabase } from "@/lib/supabase.js";

/* Section Color Overrides Component - Enhanced for partial overrides */
function SectionColorOverrides({ activeBlock, onColorChange, onReset, onClearKey, globalColors = {} }) {
  // Force re-render when globalColors changes by adding it as a key dependency
  const globalColorKey = React.useMemo(() => JSON.stringify(globalColors), [globalColors]);
  
  // Get current effective colors (global + section overrides)
  const currentColors = React.useMemo(() => {
    const defaults = readTokenDefaults();
    const overrides = activeBlock?.overrides?.values || {};
    return resolvePalette(defaults, globalColors, overrides);
  }, [activeBlock?.overrides?.values, globalColorKey]);
  
  if (!activeBlock) return null;

  // More robust override check - check the actual overrides object
  const hasOverrides = React.useMemo(() => {
    const vals = activeBlock?.overrides?.values;
    return vals && typeof vals === 'object' && Object.keys(vals).length > 0;
  }, [activeBlock?.overrides?.values]);
  
  // Same color order as ThemeAside
  const colorOrder = [
    "primary", 
    "secondary",
    "background",
    "alt-background"
  ];

  // Helper to set color with automatic foreground adjustment
  const setRole = (key) => (hex) => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
    onColorChange(key, hex);
  };

  // Reset function
  const handleReset = () => {
    onReset();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Section Colors</span>
        {hasOverrides && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {colorOrder.filter(k => k in currentColors).map((keyName) => (
          <ColorRole
            key={`color-${keyName}-${currentColors[keyName]}`}
            label={keyName.replace(/-/g, " ")}
            value={currentColors[keyName] ?? "#000000"}
            onChange={setRole(keyName)}
            isOverridden={(activeBlock.overrides?.values && keyName in activeBlock.overrides.values) || false}
            onClearKey={() => {
              if (!activeBlock) return;
              // Clear only this key from overrides and persist via provided setters
              const nextValues = { ...(activeBlock.overrides?.values || {}) };
              delete nextValues[keyName];
              const base = { enabled: Object.keys(nextValues).length > 0, values: nextValues, valuesPP: activeBlock.overrides?.valuesPP || {} };
              if (activeBlock.type === 'Navbar' && typeof setNavbarOverrides === 'function') {
                setNavbarOverrides(base);
              } else if (activeBlock.type === 'Footer' && typeof setFooterOverrides === 'function') {
                setFooterOverrides(base);
              } else if (typeof setBlockOverrides === 'function') {
                setBlockOverrides(activeBlock.id, base);
              } else {
                setBlocks(prev => prev.map(block => block.id === activeBlock.id ? { ...block, overrides: base } : block));
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* Color input row component with override indicator */
function ColorRole({ label, value, onChange, isOverridden = false }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {isOverridden && (
          <div className="h-2 w-2 rounded-full bg-blue-500" title="This color is overridden" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border"
        />
        <input
          type="text"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-28 rounded-md border px-2 text-sm font-mono"
        />
        {isOverridden && typeof onChange === 'function' && typeof onClearKey === 'function' && (
          <button
            type="button"
            onClick={onClearKey}
            className="h-8 px-2 text-[11px] rounded border bg-white hover:bg-gray-50"
            title="Revert this color to inherit"
          >
            Revert
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left Sidebar (reused in onboarding)                                */
/* ------------------------------------------------------------------ */

export default function EditorSidebar({
  activeBlockId, activeBlock, partList, copyList,
  approvedMode, SECTIONS_REG = SECTIONS,
  closePanel, handleDelete, handleMoveUp, handleMoveDown,
  onTogglePartFromSidebar, onCopyChangeFromSidebar,
  variantIndex, setVariantForId, variantForId, setBlocks, blocks,
  setNavbarOverrides, setFooterOverrides, setBlockOverrides,
  images, onImageChange,
  previewRef = null,
  mode = "builder",
  hideVariantPicker = false,
  hideAdvancedActions = false,
  staticLayout = false,
  hideCloseAction = false,
  onSaveNext,
  globalColors = {},
  inviteRow = null,
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

  const [hasImages, setHasImages] = useState(false);


  // Map dynamic extra content ids (e.g., "extraContent_1") to the canonical
  // registry entry so labels and variants resolve correctly.
  const effectiveType = activeBlock?.type?.startsWith('extraContent_')
    ? 'feature'
    : activeBlock?.type;
  const activeEntry = effectiveType ? SECTIONS_REG[effectiveType] : null;
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

  if (controlId) {
    // Use the discovered default visibility of the controlling part, if available
    const controllingPart = Array.isArray(partList) ? partList.find(p => p.id === controlId) : null;
    const defaultOn = controllingPart ? controllingPart.visible !== false : true;
    return isControlOn(controlId, defaultOn);
  }

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

// Split discovered parts into payment and regular parts
const paymentParts = partList.filter(p => String(p.id).startsWith('pay-'));
const regularParts = partList.filter(p => !String(p.id).startsWith('pay-'));

// Helper mapping for payment icons
const mapPaymentToIcon = (p) => {
  const id = String(p.id || '').toLowerCase();
  const label = String(p.label || '').toLowerCase();
  const key = id || label;
  const iconFor = {
    'pay-visa': '/icons/visa.svg',
    'pay-visa-debit': '/icons/visa-debit.svg',
    'pay-master': '/icons/master.svg',
    'pay-mastercard': '/icons/master.svg',
    'pay-mastercard-debit': '/icons/master-debit.svg',
    'pay-amex': '/icons/amex.svg',
    'pay-american-express': '/icons/amex.svg',
    'pay-discover': '/icons/discover.svg',
    'pay-maestro': '/icons/maestro.svg',
    'pay-apple-pay': '/icons/apple-pay.svg',
  };
  // fallback by label contains
  const src = iconFor[key] ||
    (label.includes('visa debit') ? '/icons/visa-debit.svg' :
     label.includes('visa') ? '/icons/visa.svg' :
     label.includes('mastercard debit') ? '/icons/master-debit.svg' :
     label.includes('master') ? '/icons/master.svg' :
     label.includes('american') || label.includes('amex') ? '/icons/amex.svg' :
     label.includes('discover') ? '/icons/discover.svg' :
     label.includes('maestro') ? '/icons/maestro.svg' :
     label.includes('apple') ? '/icons/apple-pay.svg' : '/icons/visa.svg');
  const title = p.label || 'Payment';
  return { src, title };
};

// Order copy list to pair copy inputs with their action URLs
const orderedCopyList = (() => {
  const regular = [];
  const actionUrls = [];
  
  // Separate regular copy inputs from action URL inputs
  visibleCopyList.forEach(p => {
    if (p.id.includes('-action')) {
      actionUrls.push(p);
    } else {
      regular.push(p);
    }
  });
  
  // Create ordered list by pairing each regular input with its action URL
  const ordered = [];
  regular.forEach(regularItem => {
    // Add the regular copy input
    ordered.push(regularItem);
    
    // Find and add its corresponding action URL input
    const actionUrl = actionUrls.find(actionItem => {
      // Extract the base ID from the action URL (e.g., "cta-button-action" -> "cta-button")
      const baseId = actionItem.id.replace('-action', '');
      return baseId === regularItem.id;
    });
    
    if (actionUrl) {
      ordered.push(actionUrl);
    }
  });
  
  // Add any remaining action URLs that don't have a corresponding regular input
  actionUrls.forEach(actionUrl => {
    const baseId = actionUrl.id.replace('-action', '');
    const hasRegular = regular.some(regularItem => regularItem.id === baseId);
    if (!hasRegular) {
      ordered.push(actionUrl);
    }
  });
  
  return ordered;
})();


  return (
    <aside className={
      staticLayout
        ? "w-full h-full overflow-hidden flex flex-col"
        : "fixed left-4 top-18 z-40 w-[290px] overflow-hidden rounded-md border bg-white shadow-lg"
    }
    >
  <div className={staticLayout
    ? "flex h-auto flex-col overflow-visible"
    : "flex h[calc(100vh-6rem)] flex-col overflow-visible"
  }>

        <div className="min-h-0 p-4">
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

                      {(SECTIONS_REG[effectiveType]?.variants || []).map((Preview, i) => {
                        const labels = SECTIONS_REG[effectiveType]?.labels || [];
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

              {/* Payment Icons Group */}
              {paymentParts.length > 0 && (
                <>
                <div className="my-6">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Accepted Payments</div>
                  <div className="grid grid-cols-4 gap-2">
                    {paymentParts.map(p => {
                      const checked = getControlChecked(p);
                      const { src, title } = mapPaymentToIcon(p);
                      return (
                        <button 
                          key={p.id} 
                          type="button" 
                          title={title}
                          onClick={() => !approvedMode && onTogglePartFromSidebar(p.id, !checked)}
                          className={[
                            'h-9 flex items-center justify-center rounded border bg-white hover:bg-gray-50',
                            checked ? 'opacity-100' : 'opacity-40'
                          ].join(' ')}
                        >
                          <img src={src} alt={title} className="h-5 w-auto"/>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Separator className="my-3" />
                </>
              )}
              

              <div className="my-6">
                <div className="text-xs font-semibold text-gray-500 mb-2">Display Sections</div>
                <div className="space-y-2">
                  {regularParts.length > 0 ? (
                    regularParts.map((p) => {
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
                {orderedCopyList.length > 0 ? (
                  orderedCopyList.map((p) => {
                    const current =
                      activeBlock?.copy && typeof activeBlock.copy[p.id] === "string"
                        ? activeBlock.copy[p.id]
                        : p.defaultText;
                    const max = p.maxChars || 120;
                    const isActionUrl = p.id.includes('-action');
                    const hasPlaceholder = p.placeholder;
                    // Footer-specific mapping and helpers
                    const isFooter = activeBlock?.type === 'Footer';
                    const baseId = isActionUrl ? p.id.replace('-action', '') : p.id;
                    // Build a quick map of base id -> label from non-action items
                    const baseLabelMap = (() => {
                      const map = new Map();
                      visibleCopyList.forEach(ci => {
                        if (!String(ci.id).includes('-action')) map.set(ci.id, ci.label || ci.id);
                      });
                      return map;
                    })();
                    const baseLabel = baseLabelMap.get(baseId);

                    // Helpers for document upload
                    const inviteToken = (() => {
                      try {
                        const hash = window.location.hash || '';
                        const q = hash.includes('?') ? hash.split('?')[1] : '';
                        const params = new URLSearchParams(q);
                        return params.get('invite');
                      } catch { return null; }
                    })();

                    const slug = (s = '') => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

                    const uploadDocument = async (file) => {
                      if (!file) return null;
                      const bucket = 'charity-logos';
                      const name = `${slug(baseLabel || baseId)}-${Date.now()}.${file.name.split('.').pop() || 'bin'}`;
                      const path = inviteToken ? `documents/${inviteToken}/${name}` : `documents/misc/${name}`;
                      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
                      if (error) throw error;
                      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                      return { url: data.publicUrl, name };
                    };
                    
                    return (
                      
                      <div key={p.id} className={`space-y-1 ${isActionUrl ? ' mb-8 mt-[-10px]' : ' mb-8'} px-1`}>
                        {!isActionUrl && (
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
                              {p.label}
                              {isFooter && p.label === 'About Us' && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="About Us info">
                                      <Info className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" sideOffset={6} className="p-2 text-xs max-w-[220px]">
                                    Will direct to the charity website
                                  </PopoverContent>
                                </Popover>
                              )}
                            </label>
                            <div className="text-right text-[11px] text-gray-400">{current?.length ?? 0}/{max}</div>
                          </div>
                        )}

                        {/* Footer: About Us tooltip on base input */}
                        {!isActionUrl && isFooter && (p.label === 'About Us') ? (
                          <input
                            type="text"
                            value={current ?? ''}
                            maxLength={max}
                            onChange={(e) => !approvedMode && onCopyChangeFromSidebar(p.id, e.target.value)}
                            className="w-full rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={hasPlaceholder ? p.placeholder : `Up to ${max} characters`}
                            readOnly={approvedMode}
                          />
                        ) : null}

                        {/* Footer: Document upload for Rules of Play & FAQs */}
                        {isActionUrl && isFooter && (baseLabel === 'Rules of Play' || baseLabel === 'FAQs') ? (
                          <div className="flex items-center gap-2">
                            {current ? (
                              // Document uploaded - show filename + X button
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-xs text-gray-500 truncate max-w-[140px]" title={current}>{current.split('/').pop()}</span>
                                <button
                                  type="button"
                                  className="h-7 w-7 flex items-center justify-center rounded border text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                  aria-label="Remove file"
                                  onClick={() => !approvedMode && onCopyChangeFromSidebar(p.id, '')}
                                  title="Remove file"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              // No document - show file input
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={async (e) => {
                                  if (approvedMode) return;
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await uploadDocument(file);
                                    if (res?.url) {
                                      onCopyChangeFromSidebar(p.id, res.url);
                                    }
                                  } catch (err) {
                                    console.error('Upload failed', err);
                                  }
                                }}
                                className="text-xs block text-sm text-gray-900 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                              />
                            )}
                          </div>
                        ) : null}

                        {/* Footer: Email for Contact Us */}
                        {isActionUrl && isFooter && baseLabel === 'Contact Us' ? (
                          <input
                            type="email"
                            value={(current || '').replace(/^mailto:/i, '')}
                            onChange={(e) => !approvedMode && onCopyChangeFromSidebar(p.id, e.target.value)}
                            onBlur={(e) => {
                              if (approvedMode) return;
                              const val = (e.target.value || '').trim();
                              if (!val) return;
                              const emailRe = /(^[^\s@]+@[^\s@]+\.[^\s@]+$)/i;
                              if (emailRe.test(val)) {
                                onCopyChangeFromSidebar(p.id, `mailto:${val}`);
                              }
                            }}
                            className="w-full rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={p.placeholder || `Up to ${max} characters`}
                            readOnly={approvedMode}
                          />
                        ) : null}

                        {/* Default text/URL input */}
                        {!(isFooter && (
                          (!isActionUrl && p.label === 'About Us') ||
                          (isActionUrl && (baseLabel === 'Rules of Play' || baseLabel === 'FAQs' || baseLabel === 'Contact Us'))
                        )) && (
                          <input
                            type="text"
                            value={current ?? ""}
                            maxLength={max}
                            onChange={(e) => !approvedMode && onCopyChangeFromSidebar(p.id, e.target.value)}
                            className="w-full rounded-md border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={hasPlaceholder ? p.placeholder : `Up to ${max} characters`}
                            readOnly={approvedMode}
                          />
                        )}
                      </div>
                      
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500">No copy-editable parts in this section.</div>
                )}
              </div>

              {/* Images section */}
              {images && onImageChange && (
                <>
                  {hasImages && <Separator className="my-3" />}
                  {hasImages && <div className="text-xs font-semibold text-gray-500 my-4">Images</div>}
                  <div>
                    <ImageManager
                      sectionId={activeBlock?.type}
                      images={images}
                      onImageChange={onImageChange}
                      compact={true}
                      mode={mode === "builder" ? "external" : "wrapper"}
                      previewRef={previewRef}
                      controls={activeBlock?.controls || {}}
                      onHasImagesChange={setHasImages}
                      includeCharityLogo={activeBlock?.type === 'Navbar'}
                      charityLogo={activeBlock?.type === 'Navbar' ? (() => {
                        // Get charity logo from inviteRow for Navbar
                        if (typeof inviteRow?.onboarding_json?.charityInfo?.charityLogo === 'string') {
                          return inviteRow.onboarding_json.charityInfo.charityLogo;
                        }
                        return "";
                      })() : ""}
                    />
                  </div>
                </>
              )}

              {/* Section Color Overrides - Advanced Settings */}
              {!hideAdvancedActions && mode === "builder" && (
                <>
                  <div className="mt-4 mb-4">
                    <Separator className="my-4" />
                    <SectionColorOverrides 
                        activeBlock={activeBlock}
                        globalColors={globalColors}
                        onColorChange={(colorKey, value) => {
                          if (!activeBlock) return;
                          
                          // 1. Update database via props
                          if (activeBlock.type === 'Navbar' && setNavbarOverrides) {
                            setNavbarOverrides({
                              enabled: true,
                              values: { ...(activeBlock.overrides?.values || {}), [colorKey]: value },
                              valuesPP: activeBlock.overrides?.valuesPP || {}
                            });
                          } else if (activeBlock.type === 'Footer' && setFooterOverrides) {
                            setFooterOverrides({
                              enabled: true,
                              values: { ...(activeBlock.overrides?.values || {}), [colorKey]: value },
                              valuesPP: activeBlock.overrides?.valuesPP || {}
                            });
                          } else if (setBlockOverrides) {
                            const nextValues = { ...(activeBlock.overrides?.values || {}), [colorKey]: value };
                            const nextOverride = { enabled: true, values: nextValues, valuesPP: activeBlock.overrides?.valuesPP || {} };
                            setBlockOverrides(activeBlock.id, nextOverride);
                            // Mirror to local blocks so pickers reflect immediately
                            setBlocks(prev => prev.map(block => 
                              block.id === activeBlock.id 
                                ? { ...block, overrides: nextOverride }
                                : block
                            ));
                          } else {
                            // Fallback to local state if setBlockOverrides not available
                            setBlocks(prev => prev.map(block => 
                              block.id === activeBlock.id 
                                ? {
                                    ...block,
                                    overrides: {
                                      ...block.overrides,
                                      enabled: true,
                                      values: {
                                        ...block.overrides.values,
                                        [colorKey]: value
                                      }
                                    }
                                  }
                                : block
                            ));
                          }
                          
                          // 2. Apply colors immediately (will be called after state update)
                          // No need to manually apply here - the useEffect in App.jsx will handle it
                        }}
                        onReset={() => {
                          if (!activeBlock) return;
                          
                          // Clear all overrides for this section
                          if (activeBlock.type === 'Navbar' && setNavbarOverrides) {
                            setNavbarOverrides({ enabled: false, values: {}, valuesPP: {} });
                          } else if (activeBlock.type === 'Footer' && setFooterOverrides) {
                            setFooterOverrides({ enabled: false, values: {}, valuesPP: {} });
                          } else if (setBlockOverrides) {
                            // Use the new setBlockOverrides prop for database persistence
                            const cleared = { enabled: false, values: {}, valuesPP: {} };
                            setBlockOverrides(activeBlock.id, cleared);
                            // Mirror to local blocks for instant UI
                            setBlocks(prev => prev.map(block => 
                              block.id === activeBlock.id 
                                ? { ...block, overrides: cleared }
                                : block
                            ));
                          } else {
                            // Fallback to local state if setBlockOverrides not available
                            setBlocks(prev => prev.map(block => 
                              block.id === activeBlock.id 
                                ? {
                                    ...block,
                                    overrides: { 
                                      ...block.overrides,
                                      enabled: false, 
                                      values: {}, 
                                      valuesPP: {} 
                                    }
                                  }
                                : block
                            ));
                          }
                          
                          // applyAllColors will be called by useEffect in App.jsx
                        }}
                      />
                  </div>
                </>
              )}

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
