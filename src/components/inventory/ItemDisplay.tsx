import { metadataService } from "../../services/MetadataService";
import { CdnIcon } from "../ui/CdnIcon";
import { getItemEquippedSlotTag } from "./inventoryService";
import { Item } from "./types";

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);

  const itemEquipmentSlotTag = getItemEquippedSlotTag(item);

  return (
    <div
      className={`text-xs bg-amber-800 text-white size-16 relative cursor-grab`}
      data-item-id={item.id}
      data-tooltip-id="inventory-tooltip"
    >
      <CdnIcon
        type="items"
        id={item.itemId}
        className="size-16 mx-auto"
        alt={itemData?.name ?? item.itemId}
      />
      {itemEquipmentSlotTag && (
        <p className="absolute top-0 left-0.5 text-xs italic opacity-50">
          {itemEquipmentSlotTag}
        </p>
      )}
      {item.quantity > 1 && (
        <span className="absolute bottom-0 right-0.5 text-white text-shadow font-bold">
          {item.quantity}
        </span>
      )}
    </div>
  );
};
