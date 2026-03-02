import { useNpcActions } from "../../hooks/useNpcActions";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { InteractData } from "../../types/npcInteraction";

export const NpcInteractMenu: React.FC<{ data: InteractData }> = ({
  data,
}) => {
  const socket = useSocketStore((state) => state.socket);
  const npcActions = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  const handleInteraction = (type: string, questId?: string) => {
    if (type === "acceptQuest" && questId) {
      npcActions.acceptQuest(data.npcId, questId);
      return;
    }

    const actionMap: Record<string, (npcId?: string) => void> = {
      shop: npcActions.shop,
      recipes: npcActions.recipes,
      craft: npcActions.craftList,
      dialogue: npcActions.dialogue,
      arena: npcActions.arena,
      summon: npcActions.summon,
      trade: npcActions.trade,
      stash: npcActions.stash,
    };

    const action = actionMap[type];
    if (action) {
      action(data.npcId);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-48">
      <h2 className="text-lg font-bold text-center">{npcName}</h2>
      <div className="flex flex-col gap-1">
        {data.availableInteractions
          .filter((entry) => entry.type !== "interact")
          .map((entry) => (
            <button
              key={`${entry.type}-${entry.questId ?? ""}`}
              onClick={() => handleInteraction(entry.type, entry.questId)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 cursor-pointer text-sm"
            >
              {entry.label}
            </button>
          ))}
      </div>
    </div>
  );
};
