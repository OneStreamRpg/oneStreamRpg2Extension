import { useLayoutEffect, useState } from "react";

/**
 * Tracks an element's layout size. Returns zeros until the element mounts.
 *
 * Deliberately `offsetWidth`/`offsetHeight` rather than `getBoundingClientRect`:
 * the UI sits inside a scaled container (see UiScale), and every consumer works
 * in unscaled design pixels — the same space `left`/`top` are written in.
 *
 * Used by the draggable window layer, where both the window and the layer can
 * change size at any time (panel content grows, the Twitch player resizes).
 */
export const useBoxSize = (element: HTMLElement | null) => {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!element) return;

    // No explicit first measure: observe() already delivers the current size on
    // its first callback, which also keeps this out of the render pass.
    const observer = new ResizeObserver(() => {
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
};
