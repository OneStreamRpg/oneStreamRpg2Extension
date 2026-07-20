import { useDroppable } from "@dnd-kit/core";
import { DraggableItem } from "./DraggableItem";
import { canEquipInSlot, isEmptyItem } from "./inventoryService";
import { EQUIPMENT_SLOT_ICON, EQUIPMENT_SLOT_LABEL, SLOT_FRAME_STYLE } from "./slotTheme";
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

  // Check if the currently dragged item is compatible with this slot
  const isCompatible = canEquipInSlot(slotKey, active?.data.current?.item);

  const canPlaceHere = isOver && isCompatible;
  const hasItem = item && !isEmptyItem(item);
  const placeholderIcon = EQUIPMENT_SLOT_ICON[slotKey];

  return (
    <div>
      <div
        className={`${
          canPlaceHere
            ? "outline-2 outline-[#f0d060]"
            : isDraggingActive && isCompatible
            ? "outline-2 outline-[#78dc78]"
            : ""
        } size-17 flex items-center justify-center relative`}
        style={SLOT_FRAME_STYLE}
        ref={setNodeRef}
      >
        {/* Semi-transparent slot placeholder while empty */}
        {!hasItem &&
          (placeholderIcon ? (
            <img
              src={`${import.meta.env.BASE_URL}media/img/icons/${placeholderIcon}.png`}
              alt={EQUIPMENT_SLOT_LABEL[slotKey]}
              draggable={false}
              className="size-12 pointer-events-none select-none"
              style={{ imageRendering: "pixelated", opacity: 0.3 }}
            />
          ) : (
            <span
              className="pointer-events-none select-none text-[10px]"
              style={{ color: "#9a7850", opacity: 0.7 }}
            >
              {EQUIPMENT_SLOT_LABEL[slotKey]}
            </span>
          ))}

        {hasItem && <DraggableItem item={item} containerId={slotId} />}
      </div>
    </div>
  );
};
