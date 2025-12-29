import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { useUIStore } from "../../store/useUIStore";
import { InventoryItem } from "../../types/personalChannel";
import { DraggableItem } from "./DraggableItem";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey } from "./types";

export const EquipmentSlot: React.FC<{
  item: InventoryItem | null;
  slotKey: EquipmentSlotKey;
}> = ({ item, slotKey }) => {
  const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];
  const slotId = `equipment-${slotKey}`;

  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

  const debugInventoryInfo = useUIStore((state) => state.debugInventoryInfo);

  // Check if the currently dragged item is compatible with this slot
  const isCompatible = useMemo(() => {
    const activeItem = active?.data.current?.item;
    if (!activeItem) return false;
    const allowedTypes = Array.isArray(slotConfig.type)
      ? slotConfig.type
      : [slotConfig.type];
    return allowedTypes.includes(activeItem.type);
  }, [active]);

  // MC: what is a fucking good name for that?
  const placeMe = isOver && isCompatible;
  const hasItem = item && !item.itemId.startsWith("empty");

  return (
    <div>
      <div
        className={`border border-dashed bg-amber-100 ${
          placeMe
            ? "outline-blue-500 outline-2"
            : isCompatible
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
