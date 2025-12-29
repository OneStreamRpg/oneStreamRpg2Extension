import { InventoryItem } from "../../types/personalChannel";

export const ItemDisplay: React.FC<{ item: InventoryItem }> = ({ item }) => {
  return (
    <div
      className="text-xs bg-gray-800 text-white size-16 cursor-grab relative"
      data-item-id={item.id}
    >
      <p className="absolute">
        {item.itemId}{" "}
        <span className="text-red-500">
          {item.id}: {item.quantity}
        </span>
      </p>
      {/* <img
        src={`https://cdn.onestreamrpg.com/images/items/${item.icon}.png`}
        alt={item.itemId}
        className="size-16 image-re mx-auto"
        style={{
          imageRendering: "pixelated",
        }}
      /> */}
    </div>
  );
};
