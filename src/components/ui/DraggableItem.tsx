import { useDraggable } from "@dnd-kit/core";
import React from "react";

type Props = {
  id: string;
  children?: React.ReactNode;
};

const DraggableItem = ({ id, children }: Props) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        width: children ? "100%" : 24,
        height: children ? "100%" : 24,
        backgroundImage: children ? undefined : "url(img/eta-gui/ItemsIcons_24x24.png)",
        backgroundPosition: children ? undefined : "-4px -4px",
        backgroundSize: children ? undefined : "auto",
        imageRendering: "pixelated",
        cursor: "grab",
        touchAction: "none", // Prevents browser gestures interfering with drag
        userSelect: "none", // Prevents text/image selection while dragging
      }}
    >
      {children}
    </div>
  );
};

export default DraggableItem;
