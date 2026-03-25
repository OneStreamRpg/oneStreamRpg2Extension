import { WindowContainer } from "../ui/WindowContainer";

export type PanelPage = "map" | "inventory" | "abilities" | "quests" | "stats" | "actions";

const MENU_ITEMS: { page: PanelPage; label: string; icon: string }[] = [
  { page: "map", label: "Map", icon: "quests" },
  { page: "inventory", label: "Inventory", icon: "inventory" },
  { page: "abilities", label: "Abilities", icon: "abilities" },
  { page: "quests", label: "Quests", icon: "quests" },
  { page: "stats", label: "Stats", icon: "stats" },
  { page: "actions", label: "Actions", icon: "abilities" },
];

interface PanelBurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PanelPage) => void;
  currentPage: PanelPage;
}

export const PanelBurgerMenu: React.FC<PanelBurgerMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Menu panel */}
      <div className="relative z-50 h-full w-56">
        <WindowContainer className="h-full flex flex-col" style={{ paddingRight: "8px" }}>
          <div className="flex items-center justify-between mb-4 pr-2">
            <span className="font-bold text-base" style={{ color: "#c8a020" }}>
              Menu
            </span>
            <button
              onClick={onClose}
              className="cursor-pointer text-sm"
              style={{ color: "#9a7850" }}
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-left rounded"
                style={{
                  backgroundColor:
                    currentPage === item.page ? "rgba(154, 114, 40, 0.3)" : "transparent",
                }}
              >
                <img
                  src={`/media/img/icons/${item.icon}.png`}
                  width={24}
                  height={24}
                  alt={item.label}
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </WindowContainer>
      </div>
    </div>
  );
};
