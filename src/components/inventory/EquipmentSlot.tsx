import { useDroppable } from "@dnd-kit/core";
import { useUIStore } from "../../store/useUIStore";
import { DraggableItem } from "./DraggableItem";
import { canEquipInSlot, isEmptyItem } from "./inventoryService";
import { EquipmentSlotKey, Item } from "./types";

export const EquipmentSlot: React.FC<{
  item: Item | null;
  slotKey: EquipmentSlotKey;
  isDraggingActive: boolean;
}> = ({ item, slotKey, isDraggingActive }) => {
  const slotId = `equipment-${slotKey}`;

  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const debugInventoryInfo = useUIStore((state) => state.debugInventoryInfo);

  // Check if the currently dragged item is compatible with this slot
  const isCompatible = canEquipInSlot(slotKey, active?.data.current?.item);

  const canPlaceHere = isOver && isCompatible;
  const hasItem = item && !isEmptyItem(item);

  return (
    <div>
      <div
        className={`border border-dashed bg-amber-100 ${
          canPlaceHere
            ? "outline-blue-500 outline-2"
            : isDraggingActive && isCompatible
            ? "outline-green-500 outline-2"
            : ""
        } size-17 flex items-center justify-center relative`}
        ref={setNodeRef}
      >
        {debugInventoryInfo && (
          <p className="text-xs text-red-700 absolute">{slotKey}</p>
        )}

        {hasItem && <DraggableItem item={item} containerId={slotId} />}
      </div>
    </div>
  );
};
