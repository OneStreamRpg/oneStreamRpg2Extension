import { useNpcActions } from "../../hooks/useNpcActions";
import { StashData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { CdnIcon } from "../ui/CdnIcon";
import { Item } from "../inventory/types";
import { isEmptyItem } from "../inventory/inventoryService";

export const NpcStash: React.FC<{ data: StashData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { stashPut, stashGet } = useNpcActions(socket);
  const displayedState = usePersonalChannelStore(
    (state) => state.displayedState
  );

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  const inventoryItems = displayedState?.inventory.items ?? [];
  const stashItems = data.stashItems ?? [];
  const slotsPerPage = 20;
  const totalStashSlots = (data.unlockedPages ?? 1) * slotsPerPage;

  const handleInventoryClick = (index: number) => {
    const item = inventoryItems[index];
    if (item && !isEmptyItem(item)) {
      stashPut(data.npcId, index, undefined);
    }
  };

  const handleStashClick = (index: number) => {
    const item = stashItems[index];
    if (item && !isEmptyItem(item)) {
      stashGet(data.npcId, index, undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[500px]">
      <h2 className="text-lg font-bold text-center">{npcName} - Stash</h2>
      <div className="flex gap-4">
        {/* Player Inventory */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Inventory</p>
          <div className="grid grid-cols-4 gap-1 max-h-60 overflow-y-auto">
            {inventoryItems.map((item: Item | null, index: number) => (
              <div
                key={index}
                onClick={() => handleInventoryClick(index)}
                className={`size-12 bg-gray-800 flex items-center justify-center ${
                  item && !isEmptyItem(item)
                    ? "cursor-pointer hover:bg-gray-700"
                    : ""
                }`}
              >
                {item && !isEmptyItem(item) && (
                  <CdnIcon
                    type="items"
                    id={item.itemId}
                    className="size-10"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stash */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Stash</p>
          <div className="grid grid-cols-4 gap-1 max-h-60 overflow-y-auto">
            {Array.from({ length: totalStashSlots }).map((_, index) => {
              const item = stashItems[index] ?? null;
              return (
                <div
                  key={index}
                  onClick={() => handleStashClick(index)}
                  className={`size-12 bg-gray-800 flex items-center justify-center ${
                    item && !isEmptyItem(item)
                      ? "cursor-pointer hover:bg-gray-700"
                      : ""
                  }`}
                >
                  {item && !isEmptyItem(item) && (
                    <CdnIcon
                      type="items"
                      id={item.itemId}
                      className="size-10"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
