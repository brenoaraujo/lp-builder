import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export default function AutoScaler({
  children,
  designWidth = 1440,     // 👈 your sections are designed for 1440px
  targetWidth = 320,      // width of the dock
  maxHeight = 600,        // cap preview height
  className = "",
}) {
  const scale = useMemo(() => Math.min(1, targetWidth / designWidth), [designWidth, targetWidth]);
  const innerRef = useRef(null);
  const [scaledHeight, setScaledHeight] = useState(null);

  // Measure height of child at full size
  useLayoutEffect(() => {
    if (!innerRef.current) return;
    const fullHeight = innerRef.current.scrollHeight;
    setScaledHeight(Math.min(Math.ceil(fullHeight * scale), maxHeight));
  }, [scale, children]);

  // Recalculate if inner content resizes
  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(() => {
      const fullHeight = innerRef.current.scrollHeight;
      setScaledHeight(Math.min(Math.ceil(fullHeight * scale), maxHeight));
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div
      className={className}
      style={{
        width: targetWidth,
        height: scaledHeight ?? "auto",
        overflow: "hidden",
        borderRadius: 12,
        background: "white",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none", // disable clicks inside preview
        }}
      >
        {children}
      </div>
    </div>
  );
}