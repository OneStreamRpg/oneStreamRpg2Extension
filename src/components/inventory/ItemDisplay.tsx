import { Item } from "./types";

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  return (
    <div
      className="text-xs bg-blue-100 size-16 cursor-grab relative"
      data-item-id={item.id}
    >
      <p className="absolute">
        {item.name} <span className="text-red-500">{item.type}</span>
      </p>
      <img
        src={`https://cdn.onestreamrpg.com/images/items/${item.icon}.png`}
        alt={item.name}
        className="size-16 image-re mx-auto"
        style={{
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
};
