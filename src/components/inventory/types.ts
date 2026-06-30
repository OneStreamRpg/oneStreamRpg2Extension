export type Item = {
  id: string
  itemId: string
  quantity: number
  tags: string[]
  scalings?: Record<string, number>
  value?: number
  durability?: number
  maxDurability?: number
}

export type MaterialCategory = "wood" | "stone" | "fish";

export const MATERIAL_CATEGORIES: MaterialCategory[] = ["wood", "stone", "fish"];

export const MATERIAL_CATEGORY_EMOJI: Record<MaterialCategory, string> = {
  wood: "🪵",
  stone: "🪨",
  fish: "🐟",
};

export const MATERIAL_CATEGORY_ICON: Record<MaterialCategory, string> = {
  wood: "wood",
  stone: "stone",
  fish: "fish",
};

export const materialIconSrc = (cat: MaterialCategory): string =>
  `${import.meta.env.BASE_URL}media/img/icons/${MATERIAL_CATEGORY_ICON[cat]}.png`;

export type ItemRequiredTagForEquipment =
  | "helmet"
  | "chest"
  | "pants"
  | "boots"
  | "holdable"
  | "amulet"
  | "gloves"
  | "ring"
  | "backpack";

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
  | "backpack";

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
  backpack: { requiredTag: "backpack" },
};

export type InventoryChangeEvent = {
  type: "SWAP" | "EQUIP" | "UNEQUIP" | "SWAP_EQUIP"; // MC: braucht ihr das überhaupt? idk maybe gut für wann spieler sich updaten soll oderso?
  item: Item; // The item that was dragged
  sourceId: string; // The ID of the slot it came from
  destinationId: string; // The ID of the slot it went to
  swappedItem: Item | null; // The item that was displaced (if any)
};
