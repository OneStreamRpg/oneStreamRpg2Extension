// src/components/ui/DraggableItem.tsx
import { useDraggable } from "@dnd-kit/core";

type Props = {
  id: string;
};

const DraggableItem = ({ id }: Props) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        width: 24,
        height: 24,
        backgroundImage: "url(img/eta-gui/ItemsIcons_24x24.png)",
        backgroundPosition: "-4px -4px",
        backgroundSize: "auto",
        imageRendering: "pixelated",
        cursor: "grab",
        touchAction: "none", // Prevents browser gestures interfering with drag
        userSelect: "none", // Prevents text/image selection while dragging
      }}
    />
  );
};

export default DraggableItem;
