import { metadataService } from "../../services/MetadataService";
import { Item } from "./types";

export const InventoryTooltip: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);

  if (!itemData) {
    return (
      <div className="w-80 p-4">
        <p className="text-gray-400">Unknown item: {item.itemId}</p>
      </div>
    );
  }

  return (
    <div className="w-80">
      <header className="flex border-b-2 border-gray-500">
        <img
          src={`https://cdn.onestreamrpg.com/images/items/${item.itemId}.png`}
          alt={itemData.name}
          className="size-24 m-4"
          style={{ imageRendering: "pixelated" }}
        />
        <section>
          <h2 className="text-lg font-bold" title={itemData.itemId}>{itemData.name}</h2>
          <p>{[itemData.rarity, itemData.type].filter(Boolean).join(" ")}</p>
          {itemData.damageType && <p>{itemData.damageType}</p>}
          {itemData.attackSpeed && <p>{itemData.attackSpeed}</p>}
          {itemData.scalingRange && (
            <>
              <p className="italic">Damage Scaling</p>
              {Object.entries<{ min: string; max: string }>(itemData.scalingRange).map(([stat, range]) => (
                <p key={stat} className="italic">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}: {range.min}~{range.max}
                </p>
              ))}
            </>
          )}
        </section>
      </header>
      <main className="border-b-2 border-gray-500">
        {itemData.stats && (
          <div className="border-b-2 border-gray-500">
            {Object.entries<number>(itemData.stats).map(([statKey, statValue]) => (
              <p key={statKey}>{statKey.charAt(0).toUpperCase() + statKey.slice(1)}: {statValue}</p>
            ))}
          </div>
        )}
        <p>{itemData.description}</p>
      </main>
      <footer className="flex">
        <p className="text-sm text-gray-500">Requirements</p>
        {itemData.value != null && (
          <p className="pl-2 ml-auto text-right">Sell Price: {itemData.value}g</p>
        )}
      </footer>
    </div>
  );
};
