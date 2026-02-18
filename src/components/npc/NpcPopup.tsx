import { useNpcStore } from "../../store/useNpcStore";
import { WindowContainer } from "../ui/WindowContainer";
import {
  InteractData,
  ShopData,
  RecipesData,
  CraftListData,
  DialogueData,
  ArenaData,
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

// Response types that show a transient message instead of a full UI
const MESSAGE_TYPES = new Set([
  "buy", "buyRecipe", "craft", "acceptQuest",
  "stashPut", "stashGet", "stashSwap", "tradeItem",
]);

export const NpcPopup: React.FC = () => {
  const { activePopupType, popupData, isLoading, closePopup } = useNpcStore();

  if (!activePopupType) return null;

  const renderContent = () => {
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
      </div>
    </div>
  );
};
