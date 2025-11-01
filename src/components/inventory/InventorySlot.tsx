import { useDroppable } from "@dnd-kit/core";
import { DraggableItem } from "./DraggableItem";
import { Item } from "./types";

export const InventorySlot: React.FC<{ item: Item | null, index: number }> = ({ item, index }) => {
    const slotId = `inventory-${index}`;
    const { setNodeRef } = useDroppable({
        id: slotId,
    });

    return (
        <div ref={setNodeRef} className="border border-dashed size-12">
            {item && <DraggableItem item={item} containerId={slotId} />}
        </div>
    );
}
