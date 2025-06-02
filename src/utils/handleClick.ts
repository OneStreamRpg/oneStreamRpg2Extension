// src/utils/handleClick.ts
import { MutableRefObject } from "react";

export const handleClick = (
  e: React.MouseEvent,
  socket: any,
  isConnected: boolean,
  setMarker: (coords: { x: number; y: number } | null) => void,
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
) => {
  console.log("Click event:", e.clientX, e.clientY);
  console.log("Socket state:", socket, isConnected);
  if (!socket || !isConnected) return;

  const x = e.clientX;
  const y = e.clientY;
  console.log("Sending coordinates to server:", x, y);
  socket.emit("movePlayer", { x, y });

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  setMarker({ x, y });

  timeoutRef.current = setTimeout(() => setMarker(null), 4000);
};
