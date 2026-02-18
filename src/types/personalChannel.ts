// Personal Player Channel Types

import { EquipmentSlotKey, Item } from "../components/inventory/types";
import { InteractionData } from "./npcInteraction";

export interface PlayerPersonalState {
  versions: StateVersions;
  inventory: InventoryState;
  equipment: EquipmentState;
  currency: CurrencyState;
  abilities: any;
  stats: StatsState;
  profile: any;
  quests?: QuestsState;
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
  inventory?: InventoryState;
  equipment?: EquipmentState;
  currency?: CurrencyState;
  abilities?: any;
  stats?: StatsState;
  quests?: QuestsState;
  pendingNpcInteraction?: InteractionData;
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
