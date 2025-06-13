// src/utils/handleClick.ts
import { MutableRefObject, RefObject } from "react";

export const handleClick = (
  e: React.MouseEvent,
  socket: any,
  isConnected: boolean,
  setMarker: (coords: { x: number; y: number } | null) => void,
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  containerRef: RefObject<HTMLDivElement> // 🔹 Accept ref
) => {
  if (!socket || !isConnected || !containerRef.current) return;

  const container = containerRef.current;
  const bounds = container.getBoundingClientRect();

  const rawX = e.clientX - bounds.left;
  const rawY = e.clientY - bounds.top;

  const scaleX = 1920 / bounds.width;
  const scaleY = 1080 / bounds.height;

  const scaledX = rawX * scaleX;
  const scaledY = rawY * scaleY;

  socket.emit("movePlayer", { x: scaledX, y: scaledY });

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  setMarker({ x: rawX, y: rawY }); // use raw for screen positioning

  timeoutRef.current = setTimeout(() => setMarker(null), 4000);
};
