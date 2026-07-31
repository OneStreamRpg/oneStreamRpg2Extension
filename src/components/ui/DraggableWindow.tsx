import { useLayoutEffect, useState } from "react";
import { useWindowLayoutStore } from "../../store/useWindowLayoutStore";
import {
  WINDOW_DEFAULT_ANCHORS,
  WINDOW_EDGE_INSET,
  WINDOW_TITLES,
  WindowId,
} from "../../types/windows";
import { useBoxSize } from "../../hooks/useBoxSize";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type DragOrigin = {
  pointerX: number;
  pointerY: number;
  left: number;
  top: number;
  /** Screen px per design px, so pointer travel converts to window travel. */
  scale: number;
};

/**
 * Wraps a panel so the viewer can park it anywhere in the window layer.
 *
 * Must be rendered inside a positioned container (the layer in UserInterface) —
 * that element is the drag bounds and the reference for the stored fractions.
 */
export const DraggableWindow: React.FC<{
  id: WindowId;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ id, onClose, children }) => {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [dragOrigin, setDragOrigin] = useState<DragOrigin | null>(null);
  const [dragPx, setDragPx] = useState<{ x: number; y: number } | null>(null);

  // The window layer is the nearest positioned ancestor, so it is both the drag
  // bounds and what the stored fractions are relative to.
  const container = (node?.offsetParent as HTMLElement | null) ?? null;

  const size = useBoxSize(node);
  const containerSize = useBoxSize(container);

  const position = useWindowLayoutStore((state) => state.positions[id]);
  const order = useWindowLayoutStore((state) => state.order);
  const setPosition = useWindowLayoutStore((state) => state.setPosition);
  const setAutoPosition = useWindowLayoutStore((state) => state.setAutoPosition);
  const bringToFront = useWindowLayoutStore((state) => state.bringToFront);
  const resetPosition = useWindowLayoutStore((state) => state.resetPosition);

  // Bounds are computed from the live sizes rather than stored, so a resized
  // player (theatre → fullscreen, chat collapsed) never strands a window.
  const maxLeft = Math.max(0, containerSize.w - size.w - WINDOW_EDGE_INSET);
  const maxTop = Math.max(0, containerSize.h - size.h - WINDOW_EDGE_INSET);
  const minLeft = Math.min(WINDOW_EDGE_INSET, maxLeft);
  const minTop = Math.min(WINDOW_EDGE_INSET, maxTop);

  const placed = position !== undefined;
  const left = dragPx
    ? dragPx.x
    : position
      ? clamp(position.x * containerSize.w, minLeft, maxLeft)
      : 0;
  const top = dragPx
    ? dragPx.y
    : position
      ? clamp(position.y * containerSize.h, minTop, maxTop)
      : 0;

  // First appearance (or after a layout reset): drop the window onto its
  // default anchor now that we know how big it and the layer actually are.
  useLayoutEffect(() => {
    if (placed || !containerSize.w || !containerSize.h || !size.w) return;
    const anchor = WINDOW_DEFAULT_ANCHORS[id];
    const freeX = Math.max(0, containerSize.w - size.w - WINDOW_EDGE_INSET * 2);
    const freeY = Math.max(0, containerSize.h - size.h - WINDOW_EDGE_INSET * 2);
    setAutoPosition(id, {
      x: (WINDOW_EDGE_INSET + anchor.ax * freeX) / containerSize.w,
      y: (WINDOW_EDGE_INSET + anchor.ay * freeY) / containerSize.h,
    });
  }, [placed, containerSize.w, containerSize.h, size.w, size.h, id, setAutoPosition]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    // The world layer underneath reacts to clicks — don't let a drag through.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    bringToFront(id);
    // Read the UiScale factor off the layer itself rather than importing it, so
    // this keeps working wherever the window layer ends up being nested.
    const visualWidth = container?.getBoundingClientRect().width ?? 0;
    setDragOrigin({
      pointerX: event.clientX,
      pointerY: event.clientY,
      left,
      top,
      scale: containerSize.w > 0 && visualWidth > 0 ? visualWidth / containerSize.w : 1,
    });
    setDragPx({ x: left, y: top });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin) return;
    const dx = (event.clientX - dragOrigin.pointerX) / dragOrigin.scale;
    const dy = (event.clientY - dragOrigin.pointerY) / dragOrigin.scale;
    setDragPx({
      x: clamp(dragOrigin.left + dx, minLeft, maxLeft),
      y: clamp(dragOrigin.top + dy, minTop, maxTop),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (dragPx && containerSize.w && containerSize.h) {
      setPosition(id, {
        x: dragPx.x / containerSize.w,
        y: dragPx.y / containerSize.h,
      });
    }
    setDragOrigin(null);
    setDragPx(null);
  };

  const stackIndex = order.indexOf(id);

  return (
    <div
      ref={setNode}
      className="absolute w-fit pointer-events-none"
      style={{
        left,
        top,
        zIndex: stackIndex === -1 ? 1 : 2 + stackIndex,
        // Hidden for the single frame between mounting and being measured, so
        // it doesn't flash in the top-left corner on its way to the anchor.
        visibility: placed ? "visible" : "hidden",
      }}
    >
      {/* Every window wears the same title bar: drag anywhere on it, close on
          the ✕. Panels deliberately carry no close control of their own. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title={`Drag to move ${WINDOW_TITLES[id]}`}
        className="pointer-events-auto flex items-center gap-2 select-none pl-2 pr-1"
        style={{
          height: 20,
          cursor: dragOrigin ? "grabbing" : "grab",
          backgroundColor: dragOrigin ? "#5c3015" : "#231206",
          borderTop: "3px solid #9a7228",
          borderLeft: "3px solid #3d1a06",
          borderRight: "3px solid #3d1a06",
          boxShadow: "0px 0px 8px 0px rgba(0,0,0,0.8)",
          touchAction: "none",
        }}
      >
        <span
          className="truncate"
          style={{
            color: "#c8a020",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {WINDOW_TITLES[id]}
        </span>
        {/* Both buttons swallow pointerdown, or the title bar would arm a drag
            before the click ever lands. */}
        <div className="ml-auto shrink-0 flex items-center gap-1.5">
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => resetPosition(id)}
            className="cursor-pointer flex items-center justify-center"
            style={{ color: "#9a7850", fontSize: 12, lineHeight: 1 }}
            title="Reset to default position"
          >
            ⟲
          </button>
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="cursor-pointer flex items-center justify-center"
            style={{ color: "#9a7850", fontSize: 11, lineHeight: 1 }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};
