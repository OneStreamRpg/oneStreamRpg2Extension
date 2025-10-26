import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";

export const PagesNav: React.FC = () => {
  const setActivePage = useUIStore((state) => state.setActivePage);
  return (
    <nav className="pointer-events-auto">
      <ul className="gap-2 flex">
        <li>
          <button
            className="cursor-pointer"
            onClick={() => setActivePage(Page.Inventory)}
          >
            Inventory
          </button>
        </li>
        <li>
          <button
            className="cursor-pointer"
            onClick={() => setActivePage(Page.SkillTree)}
          >
            Skill Tree
          </button>
        </li>
      </ul>
    </nav>
  );
};
