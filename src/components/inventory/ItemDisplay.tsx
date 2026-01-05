import { metadataService } from "../../services/MetadataService";
import { Item } from "./types";

const DISPLAY_ICON = false;

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);

  return (
    <div
      className="text-xs bg-gray-800 text-white size-16 cursor-grab relative"
      data-item-id={item.id}
      title={itemData?.name ?? item.itemId}
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
          <p className="">{itemData.type}</p>
          <p className="">{itemData.rarity}</p>
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
