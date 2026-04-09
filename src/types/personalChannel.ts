// Personal Player Channel Types

import { EquipmentSlotKey, Item } from "../components/inventory/types";
import { InteractionData } from "./npcInteraction";

export interface PendingClassTreeChoice {
  level: number;
  choices: string[]; // 1–3 abilityIds; length 1 is auto-resolved server-side
}

export interface PlayerPersonalState {
  versions: StateVersions;
  inventory: InventoryState;
  equipment: EquipmentState;
  currency: CurrencyState;
  abilities: AbilitiesState;
  stats: StatsState;
  profile: any;
  quests?: QuestsState;
  pendingQuestAccept?: { questId: string; npcId: string } | null;
  classTreeChoices?: Record<string, string>;
  pendingClassTreeChoice?: PendingClassTreeChoice | null;
}

export interface StateVersions {
  inventory: number;
  equipment: number;
  currency: number;
  abilities: number;
  stats: number;
  questsVersion: number;
}

export interface InventoryState {
  items: (Item | null)[];
  maxSize: number;
}

export type EquipmentState = Record<EquipmentSlotKey, Item | null>

export interface CurrencyState {
  gold: number;
  gems?: number;
  [key: string]: number | undefined;
}

export interface EquippedAbility {
  slot: "main" | "second" | "ultimate";
  abilityId: string;
  lastUsed?: number;            // Unix timestamp ms — when ability was last cast
  cooldownMs?: number;          // base cooldown in ms (used for charge regen timing)
  effectiveCooldownMs?: number; // haste-adjusted cooldown from server
  charges?: number;             // current charges (charge system only)
  maxCharges?: number;          // max charges; presence indicates charge system
  lastChargeRegenAt?: number;   // Unix timestamp ms — when last charge regen started
}

export interface AbilitiesState {
  equipped: EquippedAbility[];
  inventory: string[];
}

// TODO MC: Rework type
// export interface AbilitiesState {
//   equipped: HotbarAbility[];
//   learned: LearnedAbility[];
// }

export interface HotbarAbility {
  slot: number; // 0-3
  abilityId: string | null;
  name?: string;
  cooldown?: number;
}

export interface LearnedAbility {
  abilityId: string;
  name: string;
  level: number;
  metadata?: Record<string, any>;
}

export interface StatsState {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  [key: string]: number;
}

export interface PlayerStateDelta {
  versions: Partial<StateVersions>;
  profile?: any;
  inventory?: InventoryState;
  equipment?: EquipmentState;
  currency?: CurrencyState;
  abilities?: AbilitiesState;
  stats?: StatsState;
  quests?: QuestsState;
  pendingNpcInteraction?: InteractionData;
  classTreeChoices?: Record<string, string>;
  pendingClassTreeChoice?: PendingClassTreeChoice | null;
}

export interface PersonalChannelAction {
  actionId: string;
  seq: number;
  type: string;
  params: Record<string, any>;
}

export interface ActionAcknowledgment {
  actionId: string;
  seq: number;
  success: boolean;
  delta?: PlayerStateDelta;
  error?: string;
  timestamp: number;
  data?: InteractionData;
}

// Quest types
export interface QuestsState {
  active: ActiveQuest[];
  available: AvailableQuest[];
}

export interface ActiveQuest {
  questId: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  progressMap?: Record<string, number>;
  maxProgressMap?: Record<string, number>;
  questType: string;
}

export interface AvailableQuest {
  questId: string;
  name: string;
  description: string;
  npcId: string;
  npcName: string;
  questType: string;
}

export interface PendingAction {
  action: PersonalChannelAction;
  timestamp: number;
  beforeState: PlayerPersonalState;
}

// Action parameter types
export interface EquipItemParams {
  slotNumber: number;
  targetLocation?: string;
}

export interface SwapInventorySlotsParams {
  slot1: number;
  slot2: number;
}

export interface EquipAbilityParams {
  slotIndex: number;
  abilityId: string;
}
