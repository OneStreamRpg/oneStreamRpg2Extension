import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useUIStore } from "../store/useUIStore";
import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { LeftNav } from "./LeftNav";
import { NpcPopup } from "./npc/NpcPopup";
import { ProfileNav } from "./ProfileNav";
import { GroupPanel } from "./group/GroupPanel";
import { QuestPanel } from "./quests/QuestPanel";
import { TradePanel } from "./trade/TradePanel";
import { TradeWindow } from "./trade/TradeWindow";

export const UserInterface: React.FC = () => {
  const profileOpen = useUIStore((state) => state.profileOpen);
  const questPanelOpen = useUIStore((state) => state.questPanelOpen);
  const groupPanelOpen = useUIStore((state) => state.groupPanelOpen);
  const tradePanelOpen = useUIStore((state) => state.tradePanelOpen);
  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  // Surface the trade panel automatically when a request comes in or one is pending,
  // even if the user hasn't opened it.
  const hasTradeActivity =
    (displayedState?.pendingTradeInvites?.length ?? 0) > 0 ||
    (displayedState?.outgoingTradeInvites?.length ?? 0) > 0;
  const tradeSession = displayedState?.tradeSession ?? null;
  return (
    <main className="size-full flex flex-row pointer-events-none">
      <div className="flex-1 grid grid-cols-1 grid-rows-[auto_1fr_auto] pb-7 pt-12 px-2">
        <aside className="relative h-0">
          <div className="absolute top-0 flex flex-col gap-2 w-fit">
            {profileOpen && <ProfileNav />}
            {questPanelOpen && <QuestPanel />}
            {groupPanelOpen && <GroupPanel />}
            {(tradePanelOpen || hasTradeActivity) && !tradeSession && <TradePanel />}
          </div>
        </aside>
        <section className="overflow-hidden">
          <ActivePage />
        </section>
        <aside className="flex justify-center gap-2">
          <AbilitiesNav />
        </aside>
      </div>
      <LeftNav />
      <NpcPopup />
      {tradeSession && <TradeWindow />}
    </main>
  );
};
