import { metadataService } from "../../services/MetadataService";
import { CdnIcon } from "../ui/CdnIcon";
import { getItemEquippedSlotTag } from "./inventoryService";
import { Item } from "./types";

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);

  const itemEquipmentSlotTag = getItemEquippedSlotTag(item);
  const hasDurability = item.durability !== undefined && item.maxDurability !== undefined && item.maxDurability > 0;
  const durabilityPct = hasDurability ? item.durability! / item.maxDurability! : 1;
  const durabilityColor = durabilityPct > 0.5 ? "bg-green-400" : durabilityPct > 0.25 ? "bg-yellow-400" : "bg-red-500";

  return (
    <div
      className={`text-xs size-16 relative cursor-grab`}
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
        <p
          className="absolute top-0 left-0.5 text-[9px] italic capitalize"
          style={{ color: "#e8d08a", opacity: 0.6, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
        >
          {itemEquipmentSlotTag}
        </p>
      )}
      {item.quantity > 1 && (
        <span className="absolute bottom-0 right-0.5 text-white text-shadow font-bold">
          {item.quantity}
        </span>
      )}
      {hasDurability && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className={`h-full ${durabilityColor} transition-all duration-150`}
            style={{ width: `${durabilityPct * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
