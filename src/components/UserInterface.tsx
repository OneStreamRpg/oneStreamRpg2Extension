import { useMaterialCapWatcher } from "../hooks/useMaterialCapWatcher";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useUIStore } from "../store/useUIStore";
import { WindowId } from "../types/windows";
import { MaterialCapAlert } from "./MaterialCapAlert";
import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { LeftNav } from "./LeftNav";
import { NpcPopup } from "./npc/NpcPopup";
import { ProfileNav } from "./ProfileNav";
import { GroupPanel } from "./group/GroupPanel";
import { QuestPanel } from "./quests/QuestPanel";
import { TradePanel } from "./trade/TradePanel";
import { TradeWindow } from "./trade/TradeWindow";
import { DraggableWindow } from "./ui/DraggableWindow";

export const UserInterface: React.FC = () => {
  const profileOpen = useUIStore((state) => state.profileOpen);
  const questPanelOpen = useUIStore((state) => state.questPanelOpen);
  const groupPanelOpen = useUIStore((state) => state.groupPanelOpen);
  const tradePanelOpen = useUIStore((state) => state.tradePanelOpen);
  const toggleProfile = useUIStore((state) => state.toggleProfile);
  const toggleQuestPanel = useUIStore((state) => state.toggleQuestPanel);
  const toggleGroupPanel = useUIStore((state) => state.toggleGroupPanel);
  const toggleTradePanel = useUIStore((state) => state.toggleTradePanel);
  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  useMaterialCapWatcher();
  // Surface the trade panel automatically when a request comes in or one is pending,
  // even if the user hasn't opened it.
  const hasTradeActivity =
    (displayedState?.pendingTradeInvites?.length ?? 0) > 0 ||
    (displayedState?.outgoingTradeInvites?.length ?? 0) > 0;
  const tradeSession = displayedState?.tradeSession ?? null;
  return (
    <main className="size-full flex flex-row pointer-events-none">
      <div className="flex-1 relative">
        {/* Drag bounds for every movable window. Inset from the edges to clear
            the Twitch player chrome (top bar / seek bar) — absolutely
            positioned children ignore padding, so the insets live here. */}
        <div className="absolute top-12 bottom-7 left-2 right-2 isolate pointer-events-none">
          {profileOpen && (
            <DraggableWindow id={WindowId.Profile} onClose={toggleProfile}>
              <ProfileNav />
            </DraggableWindow>
          )}
          {questPanelOpen && (
            <DraggableWindow id={WindowId.Quests} onClose={toggleQuestPanel}>
              <QuestPanel />
            </DraggableWindow>
          )}
          {groupPanelOpen && (
            <DraggableWindow id={WindowId.Group} onClose={toggleGroupPanel}>
              <GroupPanel />
            </DraggableWindow>
          )}
          {(tradePanelOpen || hasTradeActivity) && !tradeSession && (
            <DraggableWindow
              id={WindowId.Trade}
              // Guarded: the panel can also be up because of live trade
              // activity, and a ✕ must never toggle it back open.
              onClose={() => tradePanelOpen && toggleTradePanel()}
            >
              <TradePanel />
            </DraggableWindow>
          )}
          <ActivePage />
        </div>

        {/* The action bar stays put — it is muscle memory during a fight. */}
        <div className="absolute inset-x-0 bottom-7 flex justify-center gap-2 pointer-events-none">
          <AbilitiesNav />
        </div>

        {/* Above the windows: it is a notice you are meant to catch, and it
            must not end up hidden under whatever you last dragged there. */}
        <div className="absolute top-12 inset-x-2 z-50 pointer-events-none">
          <MaterialCapAlert />
        </div>
      </div>
      <LeftNav />
      <NpcPopup />
      {tradeSession && <TradeWindow />}
    </main>
  );
};
