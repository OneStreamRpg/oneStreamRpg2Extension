import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { DraggableItem } from "./DraggableItem";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

export const EquipmentSlot: React.FC<{
    item: Item | null,
    slotKey: EquipmentSlotKey,
    activeItem: Item | null,
}> = ({
    item,
    slotKey,
    activeItem,
}) => {
        const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];
        const slotId = `equipment-${slotKey}`;

        const { setNodeRef, isOver } = useDroppable({
            id: slotId,
        });

        // Check if the currently dragged item is compatible with this slot
        const isCompatible = useMemo(() => {
            if (!activeItem) return false;
            const allowedTypes = Array.isArray(slotConfig.type) ? slotConfig.type : [slotConfig.type];
            return allowedTypes.includes(activeItem.type);
        }, [activeItem, slotConfig]);

        // MC: what is a fucking good name for that? 
        const placeMe = isOver && isCompatible;

        return (
            <div>
                <p className="text-xs">{slotKey}:</p>
                <div className={`outline-2 ${placeMe ? 'outline-green-500' : isCompatible ? 'outline-green-200' : ''} size-12`} ref={setNodeRef}>
                    {item && <DraggableItem item={item} containerId={slotId} />}
                </div>
            </div>
        );
    }
