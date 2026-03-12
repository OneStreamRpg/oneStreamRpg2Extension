import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { NpcPopup } from "./npc/NpcPopup";
import { PagesNav } from "./PagesNav";
import { PotionsNav } from "./PotionsNav";
import { ProfileNav } from "./ProfileNav";
import { QuestPanel } from "./quests/QuestPanel";

export const UserInterface: React.FC = () => {
  return (
    <main className="size-full grid grid-cols-1 grid-rows-[auto_1fr_auto] pb-7 pt-12 px-2 pointer-events-none">
      <aside className="flex justify-between w-full">
        <div className="relative flex flex-col gap-2">
          <ProfileNav />
          <QuestPanel />
        </div>
        <PagesNav />
      </aside>
      <section className="overflow-hidden">
        <ActivePage />
      </section>
      <aside className="flex justify-center gap-2">
        <AbilitiesNav />
        <PotionsNav />
      </aside>
      <NpcPopup />
    </main>
  );
};
