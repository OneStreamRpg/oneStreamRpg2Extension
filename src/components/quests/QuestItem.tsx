import { useState } from "react";
import { metadataService } from "../../services/MetadataService";
import { ActiveQuest, AvailableQuest } from "../../types/personalChannel";

interface ActiveQuestItemProps {
  quest: ActiveQuest;
  onCancel: (questId: string) => void;
}

export const ActiveQuestItem: React.FC<ActiveQuestItemProps> = ({
  quest,
  onCancel,
}) => {
  const [expanded, setExpanded] = useState(false);
  const questDef = metadataService.getQuestSync(quest.questId);
  const progressPercent =
    quest.maxProgress > 0
      ? Math.round((quest.progress / quest.maxProgress) * 100)
      : 0;

  return (
    <div className="p-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <p className="text-sm font-semibold">{quest.name}</p>
        <span className="text-xs text-gray-400">{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && (
        <div className="mt-1">
          <p className="text-xs text-gray-400">{quest.description}</p>
          {quest.maxProgressMap && Object.keys(quest.maxProgressMap).length > 0 ? (
            <div className="mt-1">
              {Object.keys(quest.maxProgressMap).map((key) => {
                const current = quest.progressMap?.[key] ?? 0;
                const max = quest.maxProgressMap![key];
                return (
                  <div key={key} className="mt-1">
                    <p className="text-xs text-gray-300">{key}</p>
                    <div className="w-full bg-gray-700 h-2 mt-0.5">
                      <div
                        className="bg-blue-500 h-2"
                        style={{
                          width: `${Math.round((current / (max ?? 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {current}/{max ?? "?"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="w-full bg-gray-700 h-2 mt-1">
                <div
                  className="bg-blue-500 h-2"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {quest.progress}/{quest.maxProgress}
              </p>
            </>
          )}
          {questDef && (questDef.goldReward > 0 || questDef.xpReward > 0 || questDef.gemReward > 0 || questDef.itemReward.length > 0) && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 font-semibold">Rewards:</p>
              <div className="flex flex-wrap gap-2 mt-0.5">
                {questDef.goldReward > 0 && (
                  <span className="text-xs text-yellow-400">{questDef.goldReward} Gold</span>
                )}
                {questDef.xpReward > 0 && (
                  <span className="text-xs text-green-400">{questDef.xpReward} XP</span>
                )}
                {questDef.gemReward > 0 && (
                  <span className="text-xs text-blue-300">{questDef.gemReward} Gems</span>
                )}
                {questDef.itemReward.map((item) => (
                  <span key={item.itemId} className="text-xs text-purple-300">
                    {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.itemName}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(quest.questId);
            }}
            className="mt-1 text-xs text-red-400 hover:text-red-300 cursor-pointer"
          >
            Cancel Quest
          </button>
        </div>
      )}
    </div>
  );
};

interface AvailableQuestItemProps {
  quest: AvailableQuest;
  onNavigate: (npcId: string) => void;
}

export const AvailableQuestItem: React.FC<AvailableQuestItemProps> = ({
  quest,
  onNavigate,
}) => {
  return (
    <div className="p-2 flex items-center justify-between">
      <p className="text-sm font-semibold">Quest from {quest.npcName}</p>
      <button
        onClick={() => onNavigate(quest.npcId)}
        className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
      >
        Go to
      </button>
    </div>
  );
};
