import { useNpcActions } from "../../hooks/useNpcActions";
import { SummonData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { CdnIcon } from "../ui/CdnIcon";

export const NpcSummon: React.FC<{ data: SummonData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { summonEnemy } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Summon</h2>
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {(data.enemies ?? []).map((enemy) => (
          <div key={enemy.index} className="p-2 bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-semibold">{enemy.enemyName}</p>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <CdnIcon
                    type="items"
                    id={enemy.costItemId}
                    className="size-4"
                  />
                  {enemy.costItemName} x{enemy.costQuantity} (have:{" "}
                  {enemy.costHeld})
                </span>
              </div>
              <button
                onClick={() => summonEnemy(data.npcId, enemy.index)}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-600 cursor-pointer text-xs"
              >
                Summon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
