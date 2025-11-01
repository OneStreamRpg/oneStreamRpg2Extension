import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { DraggableItem } from "./DraggableItem";
import { Item } from "./types";

export const InventorySlot: React.FC<{ item: Item | null, index: number, activeItem: Item | null }> = ({ item, index, activeItem }) => {
    const slotId = `inventory-${index}`;
    const { setNodeRef, isOver, active } = useDroppable({
        id: slotId,
    });

    const isCompatible = useMemo(() => {
        // Don't display if no item is currently dragged
        if (!activeItem) return false;

        // If there is no item placed always allow placing
        if (!item) return true;

        const isActiveEquipment = active?.data.current?.containerId.startsWith('equipment-')

        // If items come from equipment slots, allow placing if types match
        if (isActiveEquipment)
            return isActiveEquipment && item.type === activeItem.type
        return true;
    }, [activeItem]);

    const placeMe = isOver && isCompatible;

    return (
        <div ref={setNodeRef} className={`border border-dashed size-12 ${placeMe ? 'outline-2 outline-blue-500' : isCompatible ? 'outline-2 outline-green-500' : ''}`}>
            {item && <DraggableItem item={item} containerId={slotId} />}
        </div>
    );
}
