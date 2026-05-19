import { Item } from "../components/inventory/types";

// NPC Popup types
export type NpcPopupType =
  | "interact"
  | "shop"
  | "dialogue"
  | "dialogueAnswer"
  | "arena"
  | "summon"
  | "trade"
  | "craftList"
  | "stash"
  | "questPreview"
  | "sellMenu"
  | "npcUpgrade";

// Data response shapes from server ack `data` field
// Matches actual server responses exactly

export interface NpcInteractionOption {
  type: string;
  label: string;
  questId?: string;
}

export interface InteractData {
  type: "interact";
  npcId: string;
  availableInteractions: NpcInteractionOption[];
}

export interface ShopData {
  type: "shop";
  npcId: string;
  shopItems: ShopItem[];
}

export interface ShopItem {
  itemId: string;
  goldPrice?: number;
  gemPrice?: number;
}

export interface BuyData {
  type: "buy";
  success: boolean;
  message?: string;
}

export interface SellMenuData {
  type: "sellMenu";
  npcId: string;
}

export interface SellData {
  type: "sell";
  success: boolean;
  message: string;
}

export interface SellManyData {
  type: "sellMany";
  totalGold: number;
  soldItems: { itemId: string; name: string; gold: number }[];
  skipped: number;
}

export interface DialogueData {
  type: "dialogue" | "dialogueAnswer";
  npcId: string;
  message: string;
  options: DialogueOption[];
}

export interface DialogueOption {
  index: number;
  text: string;
}

export interface ArenaData {
  type: "arena";
  npcId: string;
  arenaStones: ArenaStone[];
}

export interface SpawnArenaData {
  type: "spawnArena";
  success: boolean;
  message?: string;
}

export interface ArenaStone {
  stoneId: string;
  enemyName: string;
  index: number;
}

export interface SummonData {
  type: "summon";
  npcId: string;
  enemies: SummonEnemy[];
}

export interface SummonEnemy {
  enemyName: string;
  costItemId: string;
  costItemName: string;
  costQuantity: number;
  costHeld: number;
  index: number;
}

export interface TradeData {
  type: "trade";
  npcId: string;
  tradeItems: TradeItem[];
}

export interface TradeItem {
  itemId: string;
  costItemId: string;
  costQuantity: number;
  index: number;
}

export interface CraftListData {
  type: "craftList";
  npcId: string;
  recipes: CraftRecipe[];
}

export interface CraftRecipe {
  recipeId: string;
  name: string;
  description?: string;
  inputs: { itemId: string; quantity: number }[];
  output: { itemId: string; quantity: number };
}

export interface StashData {
  type: "stash";
  npcId: string;
  stashItems: (Item | null)[];
  unlockedPages: number;
}

export interface StashActionData {
  type: "stashPut" | "stashGet" | "stashSwap";
  success: boolean;
  message?: string;
}

export interface AcceptQuestData {
  type: "acceptQuest";
  success: boolean;
  message?: string;
}

export interface QuestPreviewItemReward {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface QuestPreviewData {
  type: "questPreview";
  quest: {
    questId: string;
    name: string;
    description: string;
    questType: string;
    goldReward: number;
    xpReward: number;
    gemReward: number;
    itemRewards: QuestPreviewItemReward[];
    npcId: string;
    npcName: string;
  };
}

export interface ConfirmAcceptQuestData {
  type: "confirmAcceptQuest";
  success: boolean;
  message: string;
  twitchChatInfo?: string;
}

export interface DeclineQuestData {
  type: "declineQuest";
  success: boolean;
}

export interface GetQuestsData {
  type: "getQuests";
  activeQuests: ActiveQuestData[];
  availableQuests: AvailableQuestData[];
}

export interface ActiveQuestData {
  questId: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  progressMap?: Record<string, number>;
  maxProgressMap?: Record<string, number>;
  questType: string;
}

export interface AvailableQuestData {
  questId: string;
  name: string;
  description: string;
  npcId: string;
  npcName: string;
  questType: string;
}

export interface CancelQuestData {
  type: "cancelQuest";
  success: boolean;
  message?: string;
}

export interface NpcUpgradeData {
  type: "npcUpgrade";
  npcId: string;
  name: string;
  level: number;
  maxLevel: boolean;
  depositedAmounts: Record<string, number>;
  upgradeRequirements?: { itemId: string; quantity: number }[];
}

export interface NpcDepositData {
  type: "npcDeposit";
  success: boolean;
  message: string;
  upgraded: boolean;
  npcId: string;
  newLevel: number;
  depositedAmounts: Record<string, number>;
  upgradeRequirements?: { itemId: string; quantity: number }[];
}

// Union type for all interaction data
export type InteractionData =
  | InteractData
  | ShopData
  | BuyData
  | SellMenuData
  | SellData
  | SellManyData
  | DialogueData
  | ArenaData
  | SpawnArenaData
  | SummonData
  | TradeData
  | CraftListData
  | StashData
  | StashActionData
  | AcceptQuestData
  | QuestPreviewData
  | ConfirmAcceptQuestData
  | DeclineQuestData
  | GetQuestsData
  | CancelQuestData
  | NpcUpgradeData
  | NpcDepositData
  | { type: string; [key: string]: any };
