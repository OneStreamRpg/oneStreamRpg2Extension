import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { MaterialMap } from "../../types/personalChannel";
import { DraggableItem } from "./DraggableItem";
import { getItemEquippedSlotTag, getMaterialCategory, isEmptyItem } from "./inventoryService";
import { Item } from "./types";

export const InventorySlot: React.FC<{
  item: Item | null;
  index: number;
  isDraggingActive: boolean;
  materialCaps?: MaterialMap;
  materialCounts?: MaterialMap;
}> = ({ item, index, isDraggingActive, materialCaps, materialCounts }) => {
  const slotId = `inventory-${index}`;
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const isCompatible = useMemo(() => {
    const activeItem = active?.data.current?.item;
    // Don't display if no item is currently dragged
    if (!activeItem) return false;

    if (!item) return true;

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

  const atCap = useMemo(() => {
    if (!hasItem || !materialCaps || !materialCounts) return false;
    const cat = getMaterialCategory(item!.itemId);
    if (!cat) return false;
    const cap = materialCaps[cat] ?? 0;
    const count = materialCounts[cat] ?? 0;
    return cap > 0 && count >= cap;
  }, [hasItem, item, materialCaps, materialCounts]);

  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed size-17 flex items-center justify-center ${
        canPlaceHere
          ? "outline-2 outline-blue-500"
          : isDraggingActive && isCompatible
          ? "outline-2 outline-green-500"
          : atCap
          ? "outline-2 outline-red-500 bg-red-500/20"
          : ""
      }`}
    >
      {hasItem && <DraggableItem item={item} containerId={slotId} />}
    </div>
  );
};
