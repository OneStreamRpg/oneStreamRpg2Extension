import { useEffect, useRef, useState } from "react";
import { usePathOverlayStore, type Waypoint } from "../store/usePathOverlayStore";
import { useSyncBarStore } from "../store/useSyncBarStore";

const PATH_COLORS: Record<string, string> = {
  enemy: "rgba(255, 60, 60, 0.85)",
  npc: "rgba(255, 220, 50, 0.85)",
  jobSpace: "rgba(120, 220, 120, 0.85)",
};

/**
 * Returns the prefix of `path` covering `progress` (0..1) of its total length,
 * so the line can be drawn growing from the player toward the destination.
 * The final point is interpolated within its segment for a smooth tip.
 */
function partialPath(path: Waypoint[], progress: number): Waypoint[] {
  if (progress >= 1 || path.length < 2) return path;
  if (progress <= 0) return [];

  const segLengths: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const len = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segLengths.push(len);
    total += len;
  }
  if (total === 0) return path;

  const target = total * progress;
  const out: Waypoint[] = [path[0]];
  let acc = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const len = segLengths[i];
    if (acc + len >= target) {
      const t = len === 0 ? 0 : (target - acc) / len;
      out.push({
        x: path[i].x + (path[i + 1].x - path[i].x) * t,
        y: path[i].y + (path[i + 1].y - path[i].y) * t,
      });
      break;
    }
    acc += len;
    out.push(path[i + 1]);
  }
  return out;
}

export const PathOverlay: React.FC = () => {
  const remainingPath = usePathOverlayStore((state) => state.remainingPath);
  const targetType = usePathOverlayStore((state) => state.targetType);
  const processQueue = usePathOverlayStore((state) => state.processQueue);
  const [progress, setProgress] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      processQueue(now);

      // While a sync bar is bridging the stream delay, grow the line in step
      // with the bar so it finishes drawing exactly as the player walks on
      // stream. With no active bar, fall back to drawing the full line.
      const bar = useSyncBarStore.getState().bar;
      if (bar && bar.durationMs > 0) {
        setProgress(Math.min(1, Math.max(0, (now - bar.startedAt) / bar.durationMs)));
      } else {
        setProgress(1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [processQueue]);

  if (remainingPath.length < 2) return null;

  const color = targetType ? PATH_COLORS[targetType] : "rgba(255, 255, 255, 0.85)";

  // Full route, drawn faint so the viewer sees the whole path immediately.
  const fullPoints = remainingPath.map((p) => `${p.x},${p.y}`).join(" ");

  // The portion "loaded" by the sync bar, drawn solid on top of the ghost so
  // the line fills in as the stream delay is bridged.
  const drawnPath = partialPath(remainingPath, progress);
  const solidPoints =
    drawnPath.length >= 2 ? drawnPath.map((p) => `${p.x},${p.y}`).join(" ") : null;

  return (
    <svg
      className="absolute inset-0 size-full pointer-events-none"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
    >
      <polyline
        points={fullPoints}
        fill="none"
        stroke={color}
        strokeOpacity={0.4}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="14 8"
      />
      {solidPoints && (
        <polyline
          points={solidPoints}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="14 8"
        />
      )}
    </svg>
  );
};
