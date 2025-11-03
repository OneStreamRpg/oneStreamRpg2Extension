import { Item } from "./types";

export const ItemDisplay: React.FC<{ item: Item }> = ({ item }) => {
  return (
    <div className="text-xs bg-blue-100 size-16 cursor-grab">
      {item.name} <span className="text-red-500">{item.type}</span>
    </div>
  );
};
