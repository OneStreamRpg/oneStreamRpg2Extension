import { useState } from "react";
import { useUIStore } from "../store/useUIStore";
import { Page } from "../types/ui";

const BEVEL_STYLE = {
  borderTop: "3px solid #9a7228",
  borderBottom: "3px solid #3d1a06",
  borderLeft: "3px solid #3d1a06",
  borderRight: "3px solid #3d1a06",
  boxShadow: [
    "inset 0 2px 0 rgba(255,220,120,0.12)",
    "inset 6px 0 0 #2d1a0a",
    "inset -6px 0 0 #2d1a0a",
    "inset 0 4px 0 rgba(255,220,120,0.08)",
    "inset 0 6px 0 #2d1a0a",
    "inset 0 -2px 0 #2d1a0a",
    "inset 0 -4px 0 rgba(0,0,0,0.3)",
    "inset 0 -6px 0 #2d1a0a",
    "inset 0px 0px 20px -5px #0a0502",
    "0px 0px 8px 0px rgba(0,0,0,0.8)",
  ].join(", "),
};

type NavButtonProps = {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const bgColor = isActive ? "#5c3015" : hovered ? "#5c3015" : "#231206";
  const borderTopColor = isActive ? "#c8a020" : "#9a7228";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      className="pointer-events-auto cursor-pointer flex items-center justify-center"
      style={{
        ...BEVEL_STYLE,
        borderTop: `3px solid ${borderTopColor}`,
        width: 44,
        height: 44,
        backgroundColor: bgColor,
      }}
    >
      <img src={`${import.meta.env.BASE_URL}media/img/icons/${icon}.png`} width={28} height={28} alt={label} />
    </button>
  );
};

export const LeftNav: React.FC = () => {
  const activePage = useUIStore((state) => state.activePage);
  const questPanelOpen = useUIStore((state) => state.questPanelOpen);
  const profileOpen = useUIStore((state) => state.profileOpen);
  const groupPanelOpen = useUIStore((state) => state.groupPanelOpen);
  const setActivePage = useUIStore((state) => state.setActivePage);
  const toggleQuestPanel = useUIStore((state) => state.toggleQuestPanel);
  const toggleProfile = useUIStore((state) => state.toggleProfile);
  const toggleGroupPanel = useUIStore((state) => state.toggleGroupPanel);

  return (
    <nav className="flex flex-col justify-start h-full gap-1 pb-7 pt-12">
      <NavButton
        icon="inventory"
        label="Inventory"
        isActive={activePage === Page.Inventory}
        onClick={() => setActivePage(Page.Inventory)}
      />
      <NavButton
        icon="abilities"
        label="Abilities"
        isActive={activePage === Page.Abilities}
        onClick={() => setActivePage(Page.Abilities)}
      />
      <NavButton
        icon="abilities"
        label="Class Tree"
        isActive={activePage === Page.ClassTree}
        onClick={() => setActivePage(Page.ClassTree)}
      />
      <NavButton
        icon="stats"
        label="Stats"
        isActive={profileOpen}
        onClick={toggleProfile}
      />
      <NavButton
        icon="quests"
        label="Quests"
        isActive={questPanelOpen}
        onClick={toggleQuestPanel}
      />
      <NavButton
        icon="group"
        label="Group"
        isActive={groupPanelOpen}
        onClick={toggleGroupPanel}
      />
      <NavButton
        icon="recipes"
        label="Recipes"
        isActive={activePage === Page.Recipes}
        onClick={() => setActivePage(Page.Recipes)}
      />
    </nav>
  );
};
