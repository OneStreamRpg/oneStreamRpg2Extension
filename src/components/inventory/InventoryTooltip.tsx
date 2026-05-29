import { metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { ResolvedDescription } from "../ui/ResolvedDescription";
import { Item } from "./types";

export const InventoryTooltip: React.FC<{ item: Item }> = ({ item }) => {
  const itemData = metadataService.getItemSync(item.itemId);
  const stats = usePersonalChannelStore((state) => state.displayedState?.stats);
  const equipment = usePersonalChannelStore((state) => state.displayedState?.equipment);

  const setData = itemData?.itemSetId ? metadataService.getItemSetSync(itemData.itemSetId) : undefined;
  const equippedItemIds = equipment
    ? new Set(Object.values(equipment).filter(Boolean).map((i) => i!.itemId))
    : new Set<string>();
  const setPieces = setData && itemData?.itemSetId
    ? Object.values(metadataService.getAllItemsSync() ?? {}).filter(
        (i: any) => i.itemSetId === itemData.itemSetId
      )
    : [];
  const equippedSetCount = setPieces.filter((i: any) => equippedItemIds.has(i.itemId)).length;
  const totalSetPieces = setData
    ? Math.max(...setData.effects.map((e) => e.piecesRequired))
    : 0;

  const hasDurability =
    item.durability !== undefined && item.maxDurability !== undefined && item.maxDurability > 0;
  const durabilityPct = hasDurability ? item.durability! / item.maxDurability! : 1;
  const durabilityColor =
    durabilityPct > 0.5 ? "text-green-400" : durabilityPct > 0.25 ? "text-yellow-400" : "text-red-400";

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
          {hasDurability && (
            <p>
              Durability:{" "}
              <span className={durabilityColor}>
                {item.durability} / {item.maxDurability}
              </span>
            </p>
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
        {itemData.effects?.map((effect: any, i: number) => (
          <div key={i} className="border-t border-gray-600 pt-1 mt-1">
            <p className="font-semibold text-sm text-yellow-200">{effect.name}</p>
            {stats
              ? <ResolvedDescription description={effect.description} scaling={effect.scaling} stats={stats} calcTooltipId="inventory-calc-tooltip" />
              : <p className="text-sm">{effect.description}</p>
            }
          </div>
        ))}
        {setData && (
          <div className="border-t-2 border-gray-500 pt-1 mt-1">
            <p className="font-semibold text-yellow-400">
              Set: {setData.name} ({equippedSetCount}/{totalSetPieces})
            </p>
            <p className="text-sm text-gray-300 italic">{setData.description}</p>
            <ul className="mt-1">
              {setPieces.map((piece: any) => {
                const equipped = equippedItemIds.has(piece.itemId);
                return (
                  <li key={piece.itemId} className={`text-sm ${equipped ? "text-green-400" : "text-gray-400"}`}>
                    {equipped ? "✓" : "·"} {piece.name}
                  </li>
                );
              })}
            </ul>
            {setData.effects.map((effect, i) => {
              const active = equippedSetCount >= effect.piecesRequired;
              return (
                <div key={i} className={`border-t border-gray-600 pt-1 mt-1 ${active ? "" : "opacity-50"}`}>
                  <p className="font-semibold text-sm text-yellow-200">
                    ({effect.piecesRequired}) {effect.name}
                  </p>
                  {stats
                    ? <ResolvedDescription description={effect.description} scaling={effect.scaling} stats={stats} calcTooltipId="inventory-calc-tooltip" />
                    : <p className="text-sm">{effect.description}</p>}
                </div>
              );
            })}
          </div>
        )}
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
