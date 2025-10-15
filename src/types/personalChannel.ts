// Personal Player Channel Types

export interface PlayerPersonalState {
  versions: StateVersions;
  inventory: InventoryState;
  equipment: EquipmentState;
  currency: CurrencyState;
  abilities: AbilitiesState;
  stats: StatsState;
}

export interface StateVersions {
  inventory: number;
  equipment: number;
  currency: number;
  abilities: number;
  stats: number;
}

export interface InventoryState {
  items: InventoryItem[];
  maxSize: number;
}

export interface InventoryItem {
  slotNumber?: number; // Optional - system uses array index as slot position
  itemId: string;
  name: string;
  type: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface EquipmentState {
  helmet?: EquippedItem;
  chest?: EquippedItem;
  legs?: EquippedItem;
  boots?: EquippedItem;
  mainHand?: EquippedItem;
  offHand?: EquippedItem;
  accessory1?: EquippedItem;
  accessory2?: EquippedItem;
}

export interface EquippedItem {
  itemId: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface CurrencyState {
  gold: number;
  gems?: number;
  [key: string]: number | undefined;
}

export interface AbilitiesState {
  hotbar: HotbarAbility[];
  learned: LearnedAbility[];
}

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
  abilities?: AbilitiesState;
  stats?: StatsState;
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

export interface UnequipItemParams {
  slotName: string;
}

export interface SwapInventorySlotsParams {
  slot1: number;
  slot2: number;
}

export interface EquipAbilityParams {
  slotIndex: number;
  abilityId: string;
}
