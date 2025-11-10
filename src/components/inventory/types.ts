// LEFT
// helmet: { type: Helmet, property: 'helmet' },
// chest: { type: Chest, property: 'chest' },
// pants: { type: Pants, property: 'pants' },
// boots: { type: Boots, property: 'boots' },
//MAIN: mainHand: { type: HoldableItem, property: 'mainHand' },

// RIGHT
// amulet: { type: Amulet, property: 'amulet' }
// gloves: { type: Glove, property: 'gloves' },
// firstRing: { type: Ring, property: 'firstRing' },
// secondRing: { type: Ring, property: 'secondRing' },
//MAIN: offHand: { type: HoldableItem, property: 'offHand' },

export type Item = {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
};
export type ItemType =
  | "Helmet"
  | "Chest"
  | "Pants"
  | "Boots"
  | "HoldableItem"
  | "Amulet"
  | "Glove"
  | "Ring";

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
  | "offHand";

export const EQUIPMENT_SLOT_CONFIG: Record<
  EquipmentSlotKey,
  { type: ItemType | ItemType[] }
> = {
  helmet: { type: "Helmet" },
  chest: { type: "Chest" },
  pants: { type: "Pants" },
  boots: { type: "Boots" },
  mainHand: { type: "HoldableItem" },
  amulet: { type: "Amulet" },
  gloves: { type: "Glove" },
  firstRing: { type: "Ring" },
  secondRing: { type: "Ring" },
  offHand: { type: "HoldableItem" },
};

export type InventoryChangeEvent = {
  type: "SWAP" | "EQUIP" | "UNEQUIP" | "SWAP_EQUIP"; // MC: braucht ihr das überhaupt? idk maybe gut für wann spieler sich updaten soll oderso?
  item: Item; // The item that was dragged
  sourceId: string; // The ID of the slot it came from
  destinationId: string; // The ID of the slot it went to
  swappedItem: Item | null; // The item that was displaced (if any)
};
