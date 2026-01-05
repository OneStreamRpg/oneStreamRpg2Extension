import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

/**
 * Checks whether an item can be placed into the given equipment slot
 */
export const canEquipInSlot = (
  slotKey: EquipmentSlotKey,
  item?: Item
): boolean => {
  if (!item) return false;
  const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];
  const requiredTag = slotConfig.requiredTag;
  return item.tags.includes(requiredTag);
};

export const isEmptyItem = (item: Item) => item.itemId.startsWith("empty")