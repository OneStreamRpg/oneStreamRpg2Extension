import { useState } from "react";
import { JoinGameScreen } from "../components/JoinGameScreen";
import { NpcPopup } from "../components/npc/NpcPopup";
import { AbilitiesPage } from "../components/abilities/AbilitiesPage";
import { Inventory } from "../components/inventory/Inventory";
import { QuestPanel } from "../components/quests/QuestPanel";
import { PanelActionsPage } from "../components/panel/PanelActionsPage";
import { PanelBurgerMenu, type PanelPage } from "../components/panel/PanelBurgerMenu";
import { PanelMapView } from "../components/panel/PanelMapView";
import { PanelNav } from "../components/panel/PanelNav";
import { PanelStatsPage } from "../components/panel/PanelStatsPage";
import { useAuthStore } from "../hooks/useAuthStore";
import { useSocketStore } from "../store/socketStore";

export const Panel: React.FC = () => {
  const { isConnected, inGame, joinStatus, joinError, joinGameFn } = useSocketStore();
  const { profile } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PanelPage>("map");
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isConnected) {
    return <JoinGameScreen status="connecting" />;
  }

  if (!inGame) {
    return (
      <JoinGameScreen
        status={joinStatus === "joining" ? "joining" : "idle"}
        error={joinError}
        onJoin={() => joinGameFn?.(profile?.login ?? "")}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: "#1a0e04" }}>
      <PanelNav
        onToggleMenu={() => setMenuOpen((o) => !o)}
        currentPage={currentPage}
      />

      <main className="flex-1 overflow-y-auto">
        {currentPage === "map" && <PanelMapView />}
        {currentPage === "inventory" && (
          <div className="p-2">
            <Inventory />
          </div>
        )}
        {currentPage === "abilities" && (
          <div className="p-2">
            <AbilitiesPage />
          </div>
        )}
        {currentPage === "quests" && (
          <div className="p-2">
            <QuestPanel />
          </div>
        )}
        {currentPage === "stats" && <PanelStatsPage />}
        {currentPage === "actions" && <PanelActionsPage />}
      </main>

      <PanelBurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />

      <NpcPopup />
    </div>
  );
};
