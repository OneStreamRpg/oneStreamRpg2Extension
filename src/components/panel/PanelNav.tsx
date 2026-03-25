import { WindowContainer } from "../ui/WindowContainer";

interface PanelNavProps {
  onToggleMenu: () => void;
  currentPage: string;
}

export const PanelNav: React.FC<PanelNavProps> = ({ onToggleMenu, currentPage }) => {
  return (
    <WindowContainer className="flex items-center gap-3 px-3 py-2" style={{ paddingRight: "12px" }}>
      <button
        onClick={onToggleMenu}
        className="cursor-pointer text-xl leading-none"
        style={{ color: "#c8a020" }}
      >
        ☰
      </button>
      <span className="font-bold text-sm capitalize" style={{ color: "#c8a020" }}>
        {currentPage}
      </span>
    </WindowContainer>
  );
};
