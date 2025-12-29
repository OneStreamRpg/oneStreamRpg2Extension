import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { InventoryItem } from "../../types/personalChannel";
import { ItemDisplay } from "./ItemDisplay";

export const DraggableItem: React.FC<{
  item: InventoryItem;
  containerId: string;
}> = ({ item, containerId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: {
        item,
        containerId,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? "none" : "transform 200ms ease",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ItemDisplay item={item} />
    </div>
  );
};
