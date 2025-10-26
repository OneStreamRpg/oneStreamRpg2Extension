import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { PagesNav } from "./PagesNav";
import { ProfileNav } from "./ProfileNav";

export const UserInterface: React.FC = () => {
  return (
    <main className="size-full flex flex-col p-2 pointer-events-none">
      <aside className="flex justify-between w-full">
        <ProfileNav />
        <PagesNav />
      </aside>
      <section className="h-full">
        <ActivePage />
      </section>
      <aside className="flex justify-center">
        <AbilitiesNav />
      </aside>
    </main>
  );
};
