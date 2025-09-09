// src/components/EditableSection.jsx
import { useEffect, useRef } from "react";

export default function EditableSection({
  controls = {},
  copyValues = {},
  onPartsDiscovered,
  onCopyDiscovered,
  children,
  discoverKey,
  fromOnboarding = false,
  autoFocus = false,
}) {
  const rootRef = useRef(null);

  const nodeId = (el, idx) => {
    const d = el.dataset || {};
    return d.id || d.label || el.getAttribute("id") || `part-${idx}`;
  };

  const defaultVisible = (el) => {
    const v = (el.getAttribute("data-display") || "").toLowerCase();
    return v === "yes" || v === "true" || v === "1";
  };

  // consider any presence of data-copy as “discover me”, but allow an opt-out with explicit "no"/"false"/"0"
  const isCopyEnabled = (el) => {
    const raw = el.getAttribute("data-copy");
    if (raw == null) return false; // no attribute, not a copy field
    const v = String(raw).toLowerCase();
    if (v === "" || v === "yes" || v === "true" || v === "1") return true;
    if (v === "no" || v === "false" || v === "0") return false;
    return true; // any other value => treat as enabled
  };

  // Discover once (and when variant changes)
  useEffect(() => {
  const root = rootRef.current;
  if (!root) return;

  // 1) visibility parts
  const visNodes = Array.from(root.querySelectorAll("[data-display]"));
  const visParts = visNodes.map((el, i) => ({
    id: nodeId(el, i),
    label: el.getAttribute("data-label") || nodeId(el, i),
    visible: defaultVisible(el),
    hideSwitchWhenHidden:
    el.getAttribute("data-hide-switch-when") === "hidden" ||
    el.getAttribute("data-hide-switch") === "true",
  }));
  onPartsDiscovered?.(visParts);

  // 2) copy parts  — presence of [data-copy], then filter truthy values
  const copyNodes = Array.from(root.querySelectorAll("[data-copy]")).filter(isCopyEnabled);

  const copyParts = copyNodes.map((el, i) => {
    const id = nodeId(el, i);
    return {
      id,
      label: el.getAttribute("data-label") || id,
      defaultText: (el.textContent || "").trim(),
      maxChars: Number(el.getAttribute("data-max-chars")) || 120,
    };
  });

  onCopyDiscovered?.(copyParts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [discoverKey]);

  // Apply visibility
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

  // Apply live copy values
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const copyNodes = Array.from(root.querySelectorAll("[data-copy]")).filter(isCopyEnabled);
    copyNodes.forEach((el, i) => {
      const id = nodeId(el, i);
      if (typeof copyValues[id] === "string") {
        el.textContent = copyValues[id];
      }
    });
  }, [copyValues, discoverKey]);

  return <div ref={rootRef}>{children}</div>;
}