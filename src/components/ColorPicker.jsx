// src/components/ColorPicker.jsx
import { useId, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function normalizeHex(v) {
  if (!v) return "";
  let s = v.trim().toLowerCase();
  if (!s.startsWith("#")) s = `#${s}`;
  // #rgb → #rrggbb
  if (s.length === 4) {
    const r = s[1], g = s[2], b = s[3];
    s = `#${r}${r}${g}${g}${b}${b}`;
  }
  // clamp to 7 chars (# + 6 digits)
  return s.slice(0, 7);
}

export default function ColorPicker({
  value = "",
  onChange,
  disabled = false,
  label = "Color",
  swatchSize = 24,
  className = "",
}) {
  const id = useId();
  const hex = useMemo(() => normalizeHex(value || ""), [value]);

  const handleHex = (v) => {
    const next = normalizeHex(v);
    if (next.length === 7) onChange?.(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={`h-8 gap-2 ${className}`}
        >
          <span
            aria-hidden
            className="rounded shadow"
            style={{
              width: swatchSize,
              height: swatchSize,
              background: hex || "transparent",
              border: "1px solid rgba(0,0,0,.1)",
            }}
          />
          <span className="font-mono text-xs">{hex || "—"}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-60 space-y-3">
        <div className="space-y-1">
          <Label htmlFor={id} className="text-xs text-gray-600">{label}</Label>
          <div className="flex items-center gap-2">
            {/* Native color input for great browser UX */}
            <input
              id={id}
              type="color"
              value={hex || "#000000"}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled}
              className="h-9 w-9 cursor-pointer rounded border"
            />
            {/* Hex field for precise edits / paste */}
            <Input
              value={hex}
              onChange={(e) => handleHex(e.target.value)}
              placeholder="#000000"
              disabled={disabled}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}