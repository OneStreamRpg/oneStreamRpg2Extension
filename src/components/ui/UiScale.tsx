import { useState } from "react";
import { useBoxSize } from "../../hooks/useBoxSize";
import { useSettingsStore } from "../../store/useSettingsStore";

/**
 * Player width at which the interface renders 1:1 — every px in the UI is a
 * "design px" measured here.
 *
 * Tuned against a fullscreen player rather than derived from a resolution:
 * 1920 read about 15% small, so this is 1920 / 1.15.
 */
export const UI_DESIGN_WIDTH = 1670;

/**
 * Guard rails on the automatic factor. A tiny embedded player would otherwise
 * shrink text past the point of being readable, and a very wide one would
 * blow the interface up well beyond anything we've laid out for.
 */
const MIN_AUTO_SCALE = 0.5;
const MAX_AUTO_SCALE = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Scales the whole interface with the Twitch player.
 *
 * The player is always 16:9, so one factor taken from its width keeps the UI
 * the same proportion of the picture whether the viewer is fullscreen or has
 * chat and the channel rail eating into it. Children keep laying out in design
 * pixels — the transform does the rest.
 */
export const UiScale: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const size = useBoxSize(node);
  const userScale = useSettingsStore((state) => state.uiScale);

  const measured = size.w > 0;
  const scale = measured
    ? clamp(size.w / UI_DESIGN_WIDTH, MIN_AUTO_SCALE, MAX_AUTO_SCALE) * userScale
    : 1;

  return (
    <div ref={setNode} className="size-full overflow-hidden pointer-events-none">
      <div
        className="pointer-events-none"
        style={{
          // Counter-sizing keeps the scaled box covering the whole player, so
          // a window dragged to the far corner still reaches the far corner.
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // One frame passes before the first measurement lands; don't show the
          // interface at the wrong size in the meantime.
          visibility: measured ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};
