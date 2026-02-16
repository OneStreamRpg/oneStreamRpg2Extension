import { metadataService } from "../../services/MetadataService";
import { getItemEquippedSlotTag } from "./inventoryService";
import { Item } from "./types";

const DISPLAY_ICON = false;

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);

  const itemEquipmentSlotTag = getItemEquippedSlotTag(item);

  return (
    <div
      className="text-xs bg-red-800 text-white size-16 cursor-default relative"
      data-item-id={item.id}
      data-tooltip-id="inventory-tooltip"
    >
      {DISPLAY_ICON ? (
        <img
          src={`https://cdn.onestreamrpg.com/images/items/${itemData.icon}.png`}
          alt={itemData.name ?? item.itemId}
          className="size-16 mx-auto"
          style={{
            imageRendering: "pixelated",
          }}
        />
      ) : (
        <>
          <p>{itemData.name}</p>
          {itemEquipmentSlotTag && (
            <p className="text-xs italic opacity-50">{itemEquipmentSlotTag}</p>
          )}
        </>
      )}
      {item.quantity > 1 && (
        <span className="absolute bottom-0 right-0.5 text-white text-shadow font-bold">
          {item.quantity}
        </span>
      )}
    </div>
  );
};
