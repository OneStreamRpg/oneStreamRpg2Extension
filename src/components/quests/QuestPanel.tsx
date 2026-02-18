import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useUIStore } from "../../store/useUIStore";
import { ActiveQuestItem, AvailableQuestItem } from "./QuestItem";

export const QuestPanel: React.FC = () => {
  const questPanelOpen = useUIStore((state) => state.questPanelOpen);
  const toggleQuestPanel = useUIStore((state) => state.toggleQuestPanel);
  const displayedState = usePersonalChannelStore(
    (state) => state.displayedState
  );
  const socket = useSocketStore((state) => state.socket);
  const { cancelQuest } = usePersonalChannelActions(socket);
  const { setTargetNpc } = useNpcActions(socket);

  const quests = displayedState?.quests;

  if (!questPanelOpen) {
    return (
      <button
        onClick={toggleQuestPanel}
        className="pointer-events-auto bg-gray-800/80 px-2 py-1 text-xs cursor-pointer hover:bg-gray-700"
      >
        Quests
      </button>
    );
  }

  return (
    <div className="pointer-events-auto bg-gray-900/90 p-2 w-56 max-h-64 overflow-y-auto absolute z-10 top-full mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">Quests</span>
        <button
          onClick={toggleQuestPanel}
          className="text-xs text-gray-400 hover:text-white cursor-pointer"
        >
          Hide
        </button>
      </div>

      {!quests ? (
        <p className="text-xs text-gray-500">No quest data</p>
      ) : (
        <>
          {quests.active.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 mb-1">Active</p>
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
              <p className="text-xs text-gray-400 mb-1">Available</p>
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
            <p className="text-xs text-gray-500">No quests</p>
          )}
        </>
      )}
    </div>
  );
};
