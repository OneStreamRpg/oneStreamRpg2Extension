import { DndContext } from "@dnd-kit/core";
import { useState } from "react";
import DraggableItem from "../ui/DraggableItem";
import InventorySlot from "../ui/InventorySlot";

const Inventory = () => {
  const [itemIndex, setItemIndex] = useState(13);

  const handleDragEnd = (event: any) => {
    const { over } = event;
    if (over) {
      const index = parseInt(over.id);
      setItemIndex(index);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 24px)",
          gap: 4,
          padding: 10,
        }}
      >
        {[...Array(36)].map((_, i) => (
          <InventorySlot key={i} id={String(i)}>
            {i === itemIndex && <DraggableItem id="sword" />}
          </InventorySlot>
        ))}
      </div>
    </DndContext>
  );
};

export default Inventory;
