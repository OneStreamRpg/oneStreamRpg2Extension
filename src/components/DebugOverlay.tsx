import { CSSProperties, useEffect, useRef, useState } from "react";
import { useUIStore } from "../store/useUIStore";
import { PagePosition } from "../types/ui";

export const DebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const pagePosition = useUIStore((state) => state.pagePosition);
  const setPagePosition = useUIStore((state) => state.setPagePosition);

  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
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
    setIsDragging(true);
    const rect = dragRef.current!.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const style: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    transform: `translate(${position.x}px, ${position.y}px)`,
    zIndex: 9999,
  };

  return (
    <>
      {!isOpen ? (
        <div
          ref={dragRef}
          style={style}
          className="flex items-center justify-center text-xs w-4 h-4 bg-green-500/20 rounded-full cursor-grab text-black/20 pointer-events-auto"
          onPointerDown={onDragStart}
          onClick={() => setIsOpen(true)}
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
              onClick={() => setIsOpen(false)}
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

            {/* <div className="p-2">
              <label className="block text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-1 text-sm text-white bg-gray-900 border border-gray-600"
              />
            </div> */}
          </div>
        </div>
      )}
    </>
  );
};
