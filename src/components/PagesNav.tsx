import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";

export const PagesNav: React.FC = () => {
  const setActivePage = useUIStore((state) => state.setActivePage);
  return (
    <nav className="">
      <ul className="gap-2 flex">
        <li onClick={() => setActivePage(Page.Inventory)}>Inventory</li>
        <li onClick={() => setActivePage(Page.SkillTree)}>Skill Tree</li>
      </ul>
    </nav>
  );
};
