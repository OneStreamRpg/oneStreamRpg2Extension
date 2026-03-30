import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useNpcStore } from "../../store/useNpcStore";
import { WindowContainer } from "../ui/WindowContainer";
import { InventoryTooltip } from "../inventory/InventoryTooltip";
import { Item } from "../inventory/types";
import { CalcBreakdown } from "../ui/CalcBreakdown";
import { ResolvedToken } from "../../utils/resolveScaling";

function makeItem(itemId: string, quantity = 1): Item {
  return { id: itemId, itemId, quantity, tags: [] };
}
import {
  InteractData,
  ShopData,
  RecipesData,
  CraftListData,
  DialogueData,
  ArenaData,
  SpawnArenaData,
  SummonData,
  TradeData,
  StashData,
} from "../../types/npcInteraction";
import { NpcInteractMenu } from "./NpcInteractMenu";
import { NpcShop } from "./NpcShop";
import { NpcRecipes } from "./NpcRecipes";
import { NpcCraft } from "./NpcCraft";
import { NpcDialogue } from "./NpcDialogue";
import { NpcArena } from "./NpcArena";
import { NpcSummon } from "./NpcSummon";
import { NpcTrade } from "./NpcTrade";
import { NpcStash } from "./NpcStash";

const SpawnArenaCountdown: React.FC<{ message: string; onDone: () => void }> = ({ message, onDone }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="flex flex-col items-center gap-4 min-w-48 p-4">
      <p className="text-sm text-center">{message}</p>
      {count > 0 && (
        <span className="text-6xl font-bold text-red-400">{count}</span>
      )}
    </div>
  );
};

// Response types that show a transient message instead of a full UI
const MESSAGE_TYPES = new Set([
  "buy", "buyRecipe", "craft", "acceptQuest",
  "stashPut", "stashGet", "stashSwap", "tradeItem",
]);

export const NpcPopup: React.FC = () => {
  const { activePopupType, popupData, isLoading, error, closePopup } = useNpcStore();

  if (!activePopupType) return null;

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 min-w-48 p-4">
          <p className="text-sm text-center" style={{ color: "#e07050" }}>{error}</p>
          <button
            onClick={closePopup}
            className="px-3 py-1 text-xs cursor-pointer"
            style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
          >
            Close
          </button>
        </div>
      );
    }

    if (isLoading && !popupData) {
      return (
        <div className="flex items-center justify-center p-8">
          <span className="text-gray-400">Loading...</span>
        </div>
      );
    }

    if (!popupData) return null;

    // Handle simple success/failure message responses
    if (MESSAGE_TYPES.has(popupData.type)) {
      const msg = (popupData as any).message;
      return (
        <div className="flex flex-col gap-2 min-w-48 p-2">
          <p className="text-sm">{msg ?? "Done."}</p>
        </div>
      );
    }

    switch (popupData.type) {
      case "interact":
        return <NpcInteractMenu data={popupData as InteractData} />;
      case "shop":
        return <NpcShop data={popupData as ShopData} />;
      case "recipes":
        return <NpcRecipes data={popupData as RecipesData} />;
      case "craftList":
        return <NpcCraft data={popupData as CraftListData} />;
      case "dialogue":
      case "dialogueAnswer":
        return <NpcDialogue data={popupData as DialogueData} />;
      case "arena":
        return <NpcArena data={popupData as ArenaData} />;
      case "spawnArena": {
        const d = popupData as SpawnArenaData;
        const msg = d.message ?? "Battle begins!";
        return <SpawnArenaCountdown message={msg} onDone={closePopup} />;
      }
      case "summon":
        return <NpcSummon data={popupData as SummonData} />;
      case "trade":
        return <NpcTrade data={popupData as TradeData} />;
      case "stash":
        return <NpcStash data={popupData as StashData} />;
      default:
        return (
          <p className="text-sm text-gray-400">
            Unknown interaction: {popupData.type}
          </p>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
      onClick={closePopup}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div onClick={(e) => e.stopPropagation()} className="relative z-10">
        <WindowContainer className="p-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={closePopup}
              className="text-gray-400 hover:text-white cursor-pointer text-sm"
            >
              Close
            </button>
          </div>
          {renderContent()}
        </WindowContainer>

        <Tooltip
          id="npc-item-tooltip"
          place="right"
          clickable
          delayShow={600}
          render={({ activeAnchor }) => {
            const itemId = activeAnchor?.getAttribute("data-item-id");
            const qty = parseInt(activeAnchor?.getAttribute("data-item-qty") ?? "1", 10);
            if (!itemId) return null;
            return <InventoryTooltip item={makeItem(itemId, qty)} />;
          }}
        />
        <Tooltip
          id="inventory-calc-tooltip"
          place="right"
          delayShow={0}
          style={{ zIndex: 9999 }}
          render={({ activeAnchor }) => {
            const raw = activeAnchor?.getAttribute("data-breakdown");
            if (!raw) return null;
            try {
              return <CalcBreakdown resolved={JSON.parse(raw) as ResolvedToken} />;
            } catch {
              return null;
            }
          }}
        />
      </div>
    </div>
  );
};
