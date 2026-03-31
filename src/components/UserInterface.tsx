import { useUIStore } from "../store/useUIStore";
import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { LeftNav } from "./LeftNav";
import { NpcPopup } from "./npc/NpcPopup";
import { PotionsNav } from "./PotionsNav";
import { ProfileNav } from "./ProfileNav";
import { QuestPanel } from "./quests/QuestPanel";

export const UserInterface: React.FC = () => {
  const profileOpen = useUIStore((state) => state.profileOpen);
  const questPanelOpen = useUIStore((state) => state.questPanelOpen);
  return (
    <main className="size-full flex flex-row pointer-events-none">
      <div className="flex-1 grid grid-cols-1 grid-rows-[auto_1fr_auto] pb-7 pt-12 px-2">
        <aside className="relative h-0">
          <div className="absolute top-0 flex flex-col gap-2 w-fit">
            {profileOpen && <ProfileNav />}
            {questPanelOpen && <QuestPanel />}
          </div>
        </aside>
        <section className="overflow-hidden">
          <ActivePage />
        </section>
        <aside className="flex justify-center gap-2">
          <AbilitiesNav />
          <PotionsNav />
        </aside>
      </div>
      <LeftNav />
      <NpcPopup />
    </main>
  );
};
