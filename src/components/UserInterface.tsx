import { AbilitiesNav } from "./AbilitiesNav";
import { PagesNav } from "./PagesNav";
import { ProfileNav } from "./ProfileNav";

export const UserInterface: React.FC = () => {
  return (
    <main className="bg-green-500/20 h-screen flex flex-col p-2">
      <section className="flex justify-between w-full">
        <ProfileNav />
        <PagesNav />
      </section>
      <section className="flex mt-auto justify-center">
        <AbilitiesNav />
      </section>
    </main>
  );
};
