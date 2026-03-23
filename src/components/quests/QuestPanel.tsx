import { useState } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useUIStore } from "../../store/useUIStore";
import { WindowContainer } from "../ui/WindowContainer";
import { windowHoverStyle } from "../ui/windowHoverStyle";
import { ActiveQuestItem, AvailableQuestItem } from "./QuestItem";

export const QuestPanel: React.FC = () => {
  const displayedState = usePersonalChannelStore(
    (state) => state.displayedState
  );
  const socket = useSocketStore((state) => state.socket);
  const { cancelQuest } = usePersonalChannelActions(socket);
  const { setTargetNpc } = useNpcActions(socket);
  const toggleQuestPanel = useUIStore((state) => state.toggleQuestPanel);
  const [isHovered, setIsHovered] = useState(false);

  const quests = displayedState?.quests;

  return (
    <div
      className="pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
    <WindowContainer className="w-56 max-h-64 overflow-y-auto" style={windowHoverStyle(isHovered)}>
      <div className="flex items-center justify-between mb-2 pr-2">
        <span className="text-sm font-bold" style={{ color: "#c8a020" }}>Quests</span>
        <button
          onClick={toggleQuestPanel}
          className="cursor-pointer flex items-center justify-center"
          style={{ color: "#9a7850", lineHeight: 1 }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {!quests ? (
        <p className="text-xs" style={{ color: "#9a7850" }}>No quest data</p>
      ) : (
        <>
          {quests.active.length > 0 && (
            <div className="mb-2">
              <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Active</p>
              <div className="flex flex-col gap-1">
                {quests.active.map((quest) => (
                  <ActiveQuestItem
                    key={quest.questId}
                    quest={quest}
                    onCancel={cancelQuest}
                  />
                ))}
              </div>
            </div>
          )}

          {quests.available.length > 0 && (
            <div>
              <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Available</p>
              <div className="flex flex-col gap-1">
                {quests.available.map((quest) => (
                  <AvailableQuestItem
                    key={quest.questId}
                    quest={quest}
                    onNavigate={setTargetNpc}
                  />
                ))}
              </div>
            </div>
          )}

          {quests.active.length === 0 && quests.available.length === 0 && (
            <p className="text-xs" style={{ color: "#9a7850" }}>No quests</p>
          )}
        </>
      )}
    </WindowContainer>
    </div>
  );
};
