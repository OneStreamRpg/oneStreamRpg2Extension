import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { DraggableItem } from "./DraggableItem";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

export const EquipmentSlot: React.FC<{
  item: Item | null;
  slotKey: EquipmentSlotKey;
}> = ({ item, slotKey }) => {
  const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];
  const slotId = `equipment-${slotKey}`;

  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });

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

  return (
    <div>
      <div
        className={`border border-dashed ${
          placeMe
            ? "outline-blue-500 outline-2"
            : isCompatible
            ? "outline-green-500 outline-2"
            : ""
        } size-16`}
        ref={setNodeRef}
      >
        <p className="text-xs -z-10 fixed">{slotKey}</p>

        {item && <DraggableItem item={item} containerId={slotId} />}
      </div>
    </div>
  );
};
