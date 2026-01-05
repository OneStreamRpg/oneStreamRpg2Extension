import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { DraggableItem } from "./DraggableItem";
import { getItemEquippedSlotTag, isEmptyItem } from "./inventoryService";
import { Item } from "./types";

export const InventorySlot: React.FC<{
  item: Item;
  index: number;
}> = ({ item, index }) => {
  const slotId = `inventory-${index}`;
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const isCompatible = useMemo(() => {
    const activeItem = active?.data.current?.item;
    // Don't display if no item is currently dragged
    if (!activeItem) return false;

    // If there is an emptyItem placed always allow placing
    if (isEmptyItem(item)) return true;

    const isFromEquipmentSlot =
      active?.data.current?.containerId.startsWith("equipment-");

    // If items come from equipment slots, allow placing if types match
    if (isFromEquipmentSlot) {
      const itemTag = getItemEquippedSlotTag(item);
      if (itemTag === null) return false;
      const isMatchingTag = itemTag === getItemEquippedSlotTag(activeItem);
      return isMatchingTag;
    }

    // If items come from other slots, allow placing if types match
    return true;
  }, [active, item]);

  const canPlaceHere = isOver && isCompatible;
  const hasItem = item && !isEmptyItem(item);

  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed size-17 flex items-center justify-center ${
        canPlaceHere
          ? "outline-2 outline-blue-500"
          : isCompatible
          ? "outline-2 outline-green-500"
          : ""
      }`}
    >
      {hasItem && <DraggableItem item={item} containerId={slotId} />}
    </div>
  );
};
