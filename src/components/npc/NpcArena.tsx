import { useNpcActions } from "../../hooks/useNpcActions";
import { ArenaData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";

export const NpcArena: React.FC<{ data: ArenaData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { spawnArena } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <h2 className="text-lg font-bold text-center">{npcName} - Arena</h2>
      <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
        {(data.arenaStones ?? []).map((stone) => (
          <div
            key={stone.index}
            className="flex items-center justify-between p-2 bg-gray-700/50"
          >
            <div className="text-sm">
              <p>{stone.enemyName}</p>
            </div>
            <button
              onClick={() => spawnArena(data.npcId, stone.index)}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 cursor-pointer text-xs"
            >
              Fight
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
