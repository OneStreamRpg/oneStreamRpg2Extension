import { AbilitiesNav } from "./AbilitiesNav";
import { ActivePage } from "./ActivePage";
import { PagesNav } from "./PagesNav";
import { ProfileNav } from "./ProfileNav";

export const UserInterface: React.FC = () => {
  return (
    <main className="bg-green-500/20 h-screen flex flex-col p-2">
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
