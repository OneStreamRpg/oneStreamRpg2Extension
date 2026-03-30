import { useNpcActions } from "../../hooks/useNpcActions";
import { ShopData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { CdnIcon } from "../ui/CdnIcon";

export const NpcShop: React.FC<{ data: ShopData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { buy } = useNpcActions(socket);
  const currency = usePersonalChannelStore((state) => state.displayedState?.currency);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  const items = data.shopItems ?? [];

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Shop</h2>
      {currency && (
        <div className="flex items-center gap-2 justify-end text-sm">
          <img src={`${import.meta.env.BASE_URL}media/img/icons/gold.png`} width={14} height={14} alt="gold" />
          <span style={{ color: "#c8a020" }}>{currency.gold ?? 0}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {items.map((item, index) => {
          const itemMeta = metadataService.getItemSync(item.itemId);
          const itemName = itemMeta?.name ?? item.itemId;

          return (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-700/50"
            >
              <CdnIcon
                type="items"
                id={item.itemId}
                className="size-10"
                data-tooltip-id="npc-item-tooltip"
                data-item-id={item.itemId}
                data-item-qty="1"
              />
              <div className="flex-1 text-sm">
                <p>{itemName}</p>
                <p className="text-xs text-gray-400">
                  {item.goldPrice !== undefined && `${item.goldPrice} gold`}
                  {item.goldPrice !== undefined &&
                    item.gemPrice !== undefined &&
                    " / "}
                  {item.gemPrice !== undefined && `${item.gemPrice} gems`}
                </p>
              </div>
              <button
                onClick={() => buy(data.npcId, index + 1)}
                className="px-3 py-1 bg-green-700 hover:bg-green-600 cursor-pointer text-xs"
              >
                Buy
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
