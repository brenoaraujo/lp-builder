// src/components/EditableSection.jsx
import { useEffect, useMemo, useRef } from "react";

/**
 * Wrap a section. It:
 * 1) scans for elements with [data-display]
 * 2) assigns a stable data-part-id if missing
 * 3) reports parts once (or when the set of parts changes)
 * 4) applies visibility from `controls`
 *
 * Props:
 *  - controls: { [partId]: boolean }
 *  - onPartsDiscovered?: (parts: {id,label,visible}[]) => void
 */
export default function EditableSection({ controls = {}, onPartsDiscovered, children }) {
  const rootRef = useRef(null);
  const lastIdsRef = useRef("[]"); // stringified list of part ids we saw last time

  // Utility: parse default visible from data-display
  const parseDefaultVisible = (el) => {
    const raw = (el.getAttribute("data-display") || "").toLowerCase();
    // anything except explicit "no"/"false"/"0" is treated as visible
    return !(raw === "no" || raw === "false" || raw === "0");
  };

  // Scan parts (memoized by the actual children structure)
  const scanParts = () => {
    const root = rootRef.current;
    if (!root) return [];

    const nodes = Array.from(root.querySelectorAll("[data-display]"));
    return nodes.map((el, i) => {
      // ensure each editable element has a stable id
      let id = el.getAttribute("data-part-id") || el.getAttribute("data-id");
      if (!id) {
        id = `part-${i}`;
        el.setAttribute("data-part-id", id);
      }
      const label =
        el.getAttribute("data-label") ||
        el.getAttribute("aria-label") ||
        (el.textContent || "").trim().slice(0, 40) ||
        `Part ${i + 1}`;

      return { id, label, visible: parseDefaultVisible(el) };
    });
  };

  // 1) Report discovered parts only when the set of IDs changes
  useEffect(() => {
    const parts = scanParts();
    const idsStr = JSON.stringify(parts.map((p) => p.id));
    if (idsStr !== lastIdsRef.current) {
      lastIdsRef.current = idsStr;
      onPartsDiscovered?.(parts);
    }
    // don’t include controls in this effect; discovery should not re-fire on toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // 2) Apply visibility from controls (runs on every toggle)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll("[data-display]"));
    for (const el of nodes) {
      const id = el.getAttribute("data-part-id") || el.getAttribute("data-id");
      const defaultVisible = parseDefaultVisible(el);
      const show = controls[id] ?? defaultVisible;
      el.style.display = show ? "" : "none";
    }
  }, [controls, children]);

  return <div ref={rootRef}>{children}</div>;
}