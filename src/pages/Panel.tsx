import { useEffect, useState } from "react";
import { JoinGameScreen } from "../components/JoinGameScreen";
import { NpcPopup } from "../components/npc/NpcPopup";
import { AbilitiesPage } from "../components/abilities/AbilitiesPage";
import { Inventory } from "../components/inventory/Inventory";
import { QuestPanel } from "../components/quests/QuestPanel";
import { RecipesPage } from "../components/recipes/RecipesPage";
import { PanelBurgerMenu, type PanelPage } from "../components/panel/PanelBurgerMenu";
import { PanelMapView } from "../components/panel/PanelMapView";
import { PanelNav } from "../components/panel/PanelNav";
import { PanelStatsPage } from "../components/panel/PanelStatsPage";
import { TradePanel } from "../components/trade/TradePanel";
import { TradeWindow } from "../components/trade/TradeWindow";
import { useAuthStore } from "../hooks/useAuthStore";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";

export const Panel: React.FC = () => {
  const { isConnected, inGame, isDying, joinStatus, joinError, joinGameFn } = useSocketStore();
  const { profile } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PanelPage>("map");
  const [menuOpen, setMenuOpen] = useState(false);

  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  const pendingTradeInvites = displayedState?.pendingTradeInvites?.length ?? 0;
  const tradeSession = displayedState?.tradeSession ?? null;

  // Surface the trade page automatically when a trade request comes in,
  // mirroring the overlay's auto-open behavior.
  useEffect(() => {
    if (pendingTradeInvites > 0) {
      setCurrentPage("trade");
    }
  }, [pendingTradeInvites]);

  if (!isConnected) {
    return <JoinGameScreen status="connecting" />;
  }

  if (!inGame && !isDying) {
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
        {currentPage === "trade" && (
          <div className="p-2 flex justify-center">
            <TradePanel />
          </div>
        )}
        {currentPage === "recipes" && (
          <div className="p-2">
            <RecipesPage />
          </div>
        )}
      </main>

      <PanelBurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />

      <NpcPopup />
      {tradeSession && <TradeWindow />}
    </div>
  );
};
