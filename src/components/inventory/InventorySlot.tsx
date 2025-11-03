import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { DraggableItem } from "./DraggableItem";
import { Item } from "./types";

export const InventorySlot: React.FC<{ item: Item | null; index: number }> = ({
  item,
  index,
}) => {
  const slotId = `inventory-${index}`;
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const isCompatible = useMemo(() => {
    const activeItem = active?.data.current?.item;
    // Don't display if no item is currently dragged
    if (!activeItem) return false;

    // If there is no item placed always allow placing
    if (!item) return true;

    const isActiveEquipment =
      active?.data.current?.containerId.startsWith("equipment-");

    // If items come from equipment slots, allow placing if types match
    if (isActiveEquipment)
      return isActiveEquipment && item.type === activeItem.type;

    // If items come from other slots, allow placing if types match
    return true;
  }, [active]);

  const placeMe = isOver && isCompatible;

  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed size-17 flex items-center justify-center ${
        placeMe
          ? "outline-2 outline-blue-500"
          : isCompatible
          ? "outline-2 outline-green-500"
          : ""
      }`}
    >
      {item && <DraggableItem item={item} containerId={slotId} />}
    </div>
  );
};
