import { CSSProperties, useEffect, useRef, useState } from "react";
import { useUIStore } from "../store/useUIStore";
import { PagePosition } from "../types/ui";

export const DebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const pagePosition = useUIStore((state) => state.pagePosition);
  const setPagePosition = useUIStore((state) => state.setPagePosition);
  const toggleDebugInventoryInfo = useUIStore(
    (state) => state.toggleDebugInventoryInfo
  );
  const debugInventoryInfo = useUIStore((state) => state.debugInventoryInfo);

  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      hasDraggedRef.current = true;

      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;

      const constrainedX = Math.max(0, newX);

      setPosition({
        x: constrainedX,
        y: newY,
      });
    };
    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const onDragStart = (e: any) => {
    hasDraggedRef.current = false;
    setIsDragging(true);
    const rect = dragRef.current!.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleOpenClick = () => {
    if (hasDraggedRef.current) return;
    setIsOpen(true);
  };

  const handleCloseClick = () => {
    if (hasDraggedRef.current) return;
    setIsOpen(false);
  };

  const style: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex: 9999,
    userSelect: "none",
  };

  return (
    <>
      {!isOpen ? (
        <div
          ref={dragRef}
          style={style}
          className="flex items-center justify-center text-xs w-4 h-4 bg-red-500/20 rounded-full cursor-grab text-black/20 pointer-events-auto"
          onPointerDown={onDragStart}
          onClick={handleOpenClick}
        >
          D
        </div>
      ) : (
        <div
          ref={dragRef}
          style={style}
          className="w-64 bg-gray-800 text-white shadow-2xl pointer-events-auto"
        >
          {/* Header */}
          <div
            className="flex justify-between items-center p-2 bg-gray-900 cursor-grab"
            onPointerDown={onDragStart}
          >
            <span>Debug Menu</span>
            <button
              onClick={handleCloseClick}
              className="px-2 py-0 text-xl hover:bg-gray-700"
            >
              &times;
            </button>
          </div>
          <div className="p-2 space-y-1">
            <button
              className="flex justify-between w-full p-2 cursor-pointer"
              onClick={() =>
                setPagePosition(
                  pagePosition === PagePosition.LEFT
                    ? PagePosition.RIGHT
                    : PagePosition.LEFT
                )
              }
            >
              <span>Menu Position</span>
              <div className="px-3 py-1 text-sm bg-blue-600 text-white min-w-[60px]">
                {PagePosition.RIGHT === pagePosition ? "Right" : "Left"}
              </div>
            </button>
            <button
              className="flex justify-between w-full p-2 cursor-pointer"
              onClick={() => toggleDebugInventoryInfo()}
            >
              <span>Debug Inventory Info</span>
              <div className="px-3 py-1 text-sm bg-blue-600 text-white min-w-[60px]">
                {debugInventoryInfo ? "On" : "Off"}
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
