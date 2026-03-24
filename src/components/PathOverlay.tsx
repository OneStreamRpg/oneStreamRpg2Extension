import { useEffect, useRef } from "react";
import { usePathOverlayStore } from "../store/usePathOverlayStore";

const PATH_COLORS: Record<string, string> = {
  enemy: "rgba(255, 60, 60, 0.85)",
  npc: "rgba(255, 220, 50, 0.85)",
};

export const PathOverlay: React.FC = () => {
  const remainingPath = usePathOverlayStore((state) => state.remainingPath);
  const targetType = usePathOverlayStore((state) => state.targetType);
  const processQueue = usePathOverlayStore((state) => state.processQueue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      processQueue(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [processQueue]);

  if (remainingPath.length < 2) return null;

  const points = remainingPath.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      className="absolute inset-0 size-full pointer-events-none"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={targetType ? PATH_COLORS[targetType] : "rgba(255, 255, 255, 0.85)"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="14 8"
      />
    </svg>
  );
};
