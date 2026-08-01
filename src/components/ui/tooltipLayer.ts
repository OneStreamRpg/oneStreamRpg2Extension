/**
 * A document-level layer that tooltips render into.
 *
 * It mirrors UiScale's transform and covers the viewport exactly, which gets us
 * three things the inline position could not: tooltips escape the scrolling
 * panels that were clipping them, they sit above every window, and they still
 * come out the same size as the interface they describe.
 *
 * Floating UI (which react-tooltip positions with) understands a scaled
 * offsetParent, so anchors outside the layer are still measured correctly —
 * hence `positionStrategy` stays on its default "absolute", which is what
 * resolves against this element. Switching it to "fixed" would bypass the
 * offsetParent and put the tooltips back in viewport pixels.
 */
const LAYER_ID = "osrpg-tooltip-layer";

let layer: HTMLDivElement | null = null;

export const getTooltipLayer = (): HTMLElement => {
  if (layer?.isConnected) return layer;

  layer = document.createElement("div");
  layer.id = LAYER_ID;
  layer.style.position = "fixed";
  layer.style.top = "0";
  layer.style.left = "0";
  layer.style.transformOrigin = "top left";
  // The layer itself must never swallow clicks; react-tooltip re-enables
  // pointer events on the tooltip element when it is `clickable`.
  layer.style.pointerEvents = "none";
  layer.style.zIndex = "9999";
  document.body.appendChild(layer);

  return layer;
};

/** Keeps the layer lined up with the interface's current scale. */
export const syncTooltipLayerScale = (scale: number) => {
  const element = getTooltipLayer();
  // Counter-sized so the scaled box still covers the whole viewport.
  element.style.width = `${100 / scale}vw`;
  element.style.height = `${100 / scale}vh`;
  element.style.transform = `scale(${scale})`;
};
