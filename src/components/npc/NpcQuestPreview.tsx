import { useNpcActions } from "../../hooks/useNpcActions";
import { useSocketStore } from "../../store/socketStore";
import { QuestPreviewData } from "../../types/npcInteraction";

const QUEST_TYPE_LABEL: Record<string, string> = {
  combat: "Combat",
  gathering: "Gathering",
  delivery: "Delivery",
  default: "Quest",
};

export const NpcQuestPreview: React.FC<{ data: QuestPreviewData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { confirmAcceptQuest, declineQuest } = useNpcActions(socket);
  const { quest } = data;

  const hasRewards =
    quest.goldReward > 0 ||
    quest.xpReward > 0 ||
    quest.gemReward > 0 ||
    quest.itemRewards.length > 0;

  return (
    <div className="flex flex-col gap-3 min-w-72 max-w-sm">
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: "#9a7850" }}>
          {quest.npcName} · {QUEST_TYPE_LABEL[quest.questType] ?? quest.questType}
        </p>
        <h2 className="text-lg font-bold" style={{ color: "#f0d8a8" }}>{quest.name}</h2>
      </div>

      {/* Description */}
      <p className="text-sm" style={{ color: "#c8a878" }}>{quest.description}</p>

      {/* Rewards */}
      {hasRewards && (
        <div className="border-t pt-2" style={{ borderColor: "#3d2a0a" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#9a7228" }}>Rewards</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {quest.goldReward > 0 && (
              <span style={{ color: "#f0c040" }}>{quest.goldReward} gold</span>
            )}
            {quest.xpReward > 0 && (
              <span style={{ color: "#80c8f0" }}>{quest.xpReward} XP</span>
            )}
            {quest.gemReward > 0 && (
              <span style={{ color: "#c080f0" }}>{quest.gemReward} gems</span>
            )}
          </div>

          {quest.itemRewards.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {quest.itemRewards.map((reward) => (
                <div
                  key={reward.itemId}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#c8a878" }}
                >
                  <img
                    src={`https://cdn.onestreamrpg.com/images/items/${reward.itemId}.png`}
                    alt={reward.itemName}
                    className="size-8"
                    style={{ imageRendering: "pixelated" }}
                    data-tooltip-id="npc-item-tooltip"
                    data-item-id={reward.itemId}
                    data-item-qty={reward.quantity}
                  />
                  <span>{reward.quantity > 1 ? `${reward.quantity}× ` : ""}{reward.itemName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => confirmAcceptQuest(quest.npcId, quest.questId)}
          className="flex-1 py-2 text-sm font-semibold cursor-pointer"
          style={{ backgroundColor: "#2a5c1a", border: "1px solid #4a9a28", color: "#a0e080" }}
        >
          Accept
        </button>
        <button
          onClick={() => declineQuest()}
          className="flex-1 py-2 text-sm cursor-pointer"
          style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228", color: "#9a7850" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
};
