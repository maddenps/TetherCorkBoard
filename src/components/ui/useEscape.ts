import { useEffect, useRef } from "react";

/**
 * While `active`, Escape calls `onEscape` and is swallowed (capture phase), so the board behind a drawer or dialog
 * does not also react to it (Escape zooms the board out).
 */
export function useEscape(active: boolean, onEscape: () => void) {
  const fn = useRef(onEscape);
  useEffect(() => {
    fn.current = onEscape;
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      fn.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active]);
}
