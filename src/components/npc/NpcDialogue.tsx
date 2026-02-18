import { useNpcActions } from "../../hooks/useNpcActions";
import { DialogueData } from "../../types/npcInteraction";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";

export const NpcDialogue: React.FC<{ data: DialogueData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { dialogueAnswer } = useNpcActions(socket);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  return (
    <div className="flex flex-col gap-3 min-w-64 max-w-96">
      <h2 className="text-lg font-bold text-center">{npcName}</h2>
      <p className="text-sm bg-gray-700/50 p-3">{data.message}</p>
      <div className="flex flex-col gap-1">
        {(data.options ?? []).map((option) => (
          <button
            key={option.index}
            onClick={() => dialogueAnswer(data.npcId, option.index)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 cursor-pointer text-sm text-left"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};
