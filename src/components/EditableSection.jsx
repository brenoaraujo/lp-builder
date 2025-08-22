// src/components/EditableSection.jsx
import { useEffect, useRef } from "react";

/**
 * Wrap a section and:
 *  - Discover editable *visibility* parts: any element with [data-display]
 *  - Discover editable *copy* parts: any element with [data-copy="yes"]
 *  - Apply visibility via inline style (no re-render gymnastics)
 *
 * props:
 *  - controls: { [partId]: boolean }
 *  - copyValues: { [partId]: string }   // (optional; you already pass this from App)
 *  - onPartsDiscovered(parts[])         // [{ id, label, visible }]
 *  - onCopyDiscovered(copyParts[])      // [{ id, label, defaultText, maxChars }]
 *
 * Notes:
 *  - Prefer adding stable data-id on your nodes, e.g. data-id="countdown"
 *  - Fallback id is data-label, then a generated index slug.
 */
export default function EditableSection({
  controls = {},
  copyValues = {},
  onPartsDiscovered,
  onCopyDiscovered,
  children,
  discoverKey,
}) {
  const rootRef = useRef(null);

  // Helper to get a stable id for a node
  const nodeId = (el, idx) => {
    const d = el.dataset || {};
    return (
      d.id ||                      // prefer explicit data-id
      d.label ||                   // then data-label
      el.getAttribute("id") ||     // then element id (if any)
      `part-${idx}`                // last resort: index-based
    );
  };

  // Helper: default visibility from data-display: "yes"/"true" => true
  const defaultVisible = (el) => {
    const v = (el.getAttribute("data-display") || "").toLowerCase();
    return v === "yes" || v === "true" || v === "1";
  };

  // Discover parts once after mount
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // 1) visibility parts
    const visNodes = Array.from(root.querySelectorAll("[data-display]"));
    const visParts = visNodes.map((el, i) => ({
      id: nodeId(el, i),
      label: el.getAttribute("data-label") || nodeId(el, i),
      visible: defaultVisible(el),
    }));

    if (onPartsDiscovered) onPartsDiscovered(visParts);

    // 2) copy parts
    const copyNodes = Array.from(root.querySelectorAll('[data-copy="yes"]'));
    const copyParts = copyNodes.map((el, i) => {
      const id = nodeId(el, i);
      return {
        id,
        label: el.getAttribute("data-label") || id,
        defaultText: (el.textContent || "").trim(),
        maxChars: Number(el.getAttribute("data-max-chars")) || 120,
      };
    });

    if (onCopyDiscovered) onCopyDiscovered(copyParts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverKey]); // re-run when the variant/key changes

  // Apply visibility whenever controls change
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const visNodes = Array.from(root.querySelectorAll("[data-display]"));
    visNodes.forEach((el, i) => {
      const id = nodeId(el, i);
      const isDefault = defaultVisible(el);
      const shouldShow = controls[id] !== undefined ? !!controls[id] : isDefault;
      el.style.display = shouldShow ? "" : "none";
    });
  }, [controls, discoverKey]);

  // Apply copy values (optional – if you chose to wire it now)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const copyNodes = Array.from(root.querySelectorAll('[data-copy="yes"]'));
    copyNodes.forEach((el, i) => {
      const id = nodeId(el, i);
      if (typeof copyValues[id] === "string") {
        // Replace textContent safely
        el.textContent = copyValues[id];
      }
    });
  }, [copyValues, discoverKey]);

  return <div ref={rootRef}>{children}</div>;
}