import { useEffect, useState } from "react";

export default function useElementWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth || 0);
    });
    ro.observe(el);
    // set initial
    setWidth(el.clientWidth || 0);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}