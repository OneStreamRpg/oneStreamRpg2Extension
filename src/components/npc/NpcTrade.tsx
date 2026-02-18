import { useNpcActions } from "../../hooks/useNpcActions";
import { TradeData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { CdnIcon } from "../ui/CdnIcon";

export const NpcTrade: React.FC<{ data: TradeData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { tradeItem } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-2 min-w-72">
      <h2 className="text-lg font-bold text-center">{npcName} - Trade</h2>
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {(data.tradeItems ?? []).map((trade) => {
          const itemMeta = metadataService.getItemSync(trade.itemId);
          const costItemMeta = metadataService.getItemSync(trade.costItemId);

          return (
            <div
              key={trade.index}
              className="flex items-center gap-2 p-2 bg-gray-700/50"
            >
              <div className="flex-1 text-xs">
                <p className="text-gray-400 mb-1">Give:</p>
                <span className="flex items-center gap-1">
                  <CdnIcon
                    type="items"
                    id={trade.costItemId}
                    className="size-4"
                  />
                  {costItemMeta?.name ?? trade.costItemId} x{trade.costQuantity}
                </span>
              </div>
              <span className="text-gray-500">→</span>
              <div className="flex-1 text-xs">
                <p className="text-gray-400 mb-1">Receive:</p>
                <span className="flex items-center gap-1">
                  <CdnIcon
                    type="items"
                    id={trade.itemId}
                    className="size-4"
                  />
                  {itemMeta?.name ?? trade.itemId}
                </span>
              </div>
              <button
                onClick={() => tradeItem(data.npcId, trade.index)}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-600 cursor-pointer text-xs"
              >
                Trade
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
