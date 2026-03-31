import { useState } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useNpcStore } from "../../store/useNpcStore";
import { SellMenuData } from "../../types/npcInteraction";
import { isEmptyItem } from "../inventory/inventoryService";
import { CdnIcon } from "../ui/CdnIcon";

export const NpcSell: React.FC<{ data: SellMenuData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { sellMany } = useNpcActions(socket);
  const currency = usePersonalChannelStore((state) => state.displayedState?.currency);
  const inventoryItems = usePersonalChannelStore((state) => state.displayedState?.inventory?.items ?? []);
  const isLoading = useNpcStore((state) => state.isLoading);

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  const getItemValue = (itemId: string, quantity: number) =>
    (metadataService.getItemSync(itemId)?.value ?? 0) * quantity;

  const toggleSlot = (index: number) => {
    const item = inventoryItems[index];
    if (!item || isEmptyItem(item)) return;
    if (getItemValue(item.itemId, item.quantity) === 0) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const totalGold = Array.from(selected).reduce((sum, idx) => {
    const item = inventoryItems[idx];
    if (!item || isEmptyItem(item)) return sum;
    return sum + getItemValue(item.itemId, item.quantity);
  }, 0);

  const handleSell = () => {
    if (selected.size === 0) return;
    // Convert to 1-based slot indices
    const slotIndices = Array.from(selected).map((i) => i + 1);
    setSelected(new Set());
    sellMany(data.npcId, slotIndices);
  };

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Sell</h2>
      {currency && (
        <div className="flex items-center gap-2 justify-end text-sm">
          <img src={`${import.meta.env.BASE_URL}media/img/icons/gold.png`} width={14} height={14} alt="gold" />
          <span style={{ color: "#c8a020" }}>{currency.gold ?? 0}</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1 max-h-80 overflow-y-auto">
        {inventoryItems.map((item, index) => {
          if (!item || isEmptyItem(item)) {
            return (
              <div
                key={index}
                className="border border-dashed size-17 flex items-center justify-center opacity-20"
              />
            );
          }

          const value = getItemValue(item.itemId, item.quantity);
          const canSell = value > 0;
          const isSelected = selected.has(index);

          return (
            <div
              key={index}
              onClick={() => canSell && toggleSlot(index)}
              className={`border size-17 flex items-center justify-center relative ${
                !canSell
                  ? "border-dashed opacity-40 cursor-not-allowed"
                  : isSelected
                  ? "border-yellow-400 outline outline-2 outline-yellow-400 cursor-pointer"
                  : "border-dashed cursor-pointer hover:border-yellow-600"
              }`}
            >
              <CdnIcon
                type="items"
                id={item.itemId}
                className="size-16"
                data-tooltip-id="npc-item-tooltip"
                data-item-id={item.itemId}
                data-item-qty={String(item.quantity)}
              />
              {item.quantity > 1 && (
                <span className="absolute bottom-0 right-0.5 text-white text-xs font-bold text-shadow">
                  {item.quantity}
                </span>
              )}
              {canSell && (
                <span className="absolute top-0 left-0.5 text-yellow-400 text-xs font-bold leading-none">
                  {value}g
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSell}
        disabled={selected.size === 0 || isLoading}
        className={`py-2 text-sm font-bold ${
          selected.size > 0 && !isLoading
            ? "bg-yellow-700 hover:bg-yellow-600 cursor-pointer"
            : "bg-gray-600 cursor-not-allowed opacity-50"
        }`}
      >
        {selected.size === 0
          ? "Select items to sell"
          : `Sell ${selected.size} item${selected.size !== 1 ? "s" : ""} for ${totalGold}g`}
      </button>
    </div>
  );
};
