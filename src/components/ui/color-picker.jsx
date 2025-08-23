import { useMemo } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

/**
 * Minimal, framework-agnostic color picker.
 *
 * Props:
 * - value: string | undefined (hex like "#ff00aa")
 * - onChange: (hex: string) => void
 * - disabled?: boolean
 * - size?: "sm" | "md"
 */
export default function ColorPicker({ value, onChange, disabled = false, size = "md" }) {
  // react-colorful expects a valid hex; if empty, show a fallback internally,
  // but keep emitting only real hex values to parent.
  const safe = useMemo(() => (isValidHex(value) ? value : "#000000"), [value]);

  return (
    <div className={`flex items-center gap-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Swatch */}
      <div
        className="h-6 w-6 rounded border"
        style={{ background: isValidHex(value) ? value : "transparent" }}
        aria-label="Current color"
        title={value || ""}
      />
      {/* Inline picker (if you want a popover, wrap this in your own Popover) */}
      <div className="flex flex-col items-start gap-2">
        <HexColorPicker color={safe} onChange={onChange} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">HEX</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">#</span>
            <HexColorInput
              color={safe}
              onChange={(v) => onChange(`#${v.replace(/^#/, "")}`)}
              prefixed={false}
              className={`rounded border px-5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                size === "sm" ? "w-24" : "w-28"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function isValidHex(s) {
  return typeof s === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(s);
}