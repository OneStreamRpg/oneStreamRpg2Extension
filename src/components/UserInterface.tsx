import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { PagesNav } from "./PagesNav";
import { ProfileNav } from "./ProfileNav";

export const UserInterface: React.FC = () => {
  return (
    <main className="size-full grid grid-cols-1 grid-rows-[auto_1fr_auto] pb-12 pt-12 px-2 pointer-events-none">
      <aside className="flex justify-between w-full">
        <ProfileNav />
        <PagesNav />
      </aside>
      <section className="overflow-hidden">
        <ActivePage />
      </section>
      <aside className="flex justify-center">
        <AbilitiesNav />
      </aside>
    </main>
  );
};
