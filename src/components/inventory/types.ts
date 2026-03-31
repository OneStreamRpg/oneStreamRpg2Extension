export type Item = {
  id: string
  itemId: string
  quantity: number
  tags: string[]
  scalings?: Record<string, number>
  value?: number
}

export type PotionItem = Item & {
  potionId: string
  charges: number
  maxCharges: number
  cooldownRemaining: number
  healAmount: number
}

export function isPotionItem(item: Item): item is PotionItem {
  return item.tags.includes("potion") && "charges" in item;
}

export type ItemRequiredTagForEquipment =
  | "helmet"
  | "chest"
  | "pants"
  | "boots"
  | "holdable"
  | "amulet"
  | "gloves"
  | "ring"
  | "holdable"
  | "potion";

export type EquipmentSlotKey =
  | "helmet"
  | "chest"
  | "pants"
  | "boots"
  | "mainHand"
  | "amulet"
  | "gloves"
  | "firstRing"
  | "secondRing"
  | "offHand"
  | "potion";

export const EQUIPMENT_SLOT_CONFIG: Record<
  EquipmentSlotKey,
  { requiredTag: ItemRequiredTagForEquipment }
> = {
  helmet: { requiredTag: "helmet" },
  chest: { requiredTag: "chest" },
  pants: { requiredTag: "pants" },
  boots: { requiredTag: "boots" },
  mainHand: { requiredTag: "holdable" },
  amulet: { requiredTag: "amulet" },
  gloves: { requiredTag: "gloves" },
  firstRing: { requiredTag: "ring" },
  secondRing: { requiredTag: "ring" },
  offHand: { requiredTag: "holdable" },
  potion: { requiredTag: "potion" },
};

export type InventoryChangeEvent = {
  type: "SWAP" | "EQUIP" | "UNEQUIP" | "SWAP_EQUIP"; // MC: braucht ihr das überhaupt? idk maybe gut für wann spieler sich updaten soll oderso?
  item: Item; // The item that was dragged
  sourceId: string; // The ID of the slot it came from
  destinationId: string; // The ID of the slot it went to
  swappedItem: Item | null; // The item that was displaced (if any)
};
