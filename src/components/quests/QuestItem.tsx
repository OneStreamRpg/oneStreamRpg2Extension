import { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <p className="text-sm font-semibold">Quest from {quest.npcName}</p>
        <span className="text-xs text-gray-400">{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && (
        <div className="mt-1">
          <p className="text-xs text-gray-300 font-medium">{quest.name}</p>
          <p className="text-xs text-gray-400">{quest.description}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(quest.npcId);
            }}
            className="mt-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Go to {quest.npcName}
          </button>
        </div>
      )}
    </div>
  );
};
