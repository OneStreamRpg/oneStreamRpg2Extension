import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

export const isItemCompatible = (
  item: Item,
  slotKey: EquipmentSlotKey
): boolean => {
  const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];
  if (!slotConfig) return false;
  const allowedTypes = Array.isArray(slotConfig.type)
    ? slotConfig.type
    : [slotConfig.type];
  return allowedTypes.includes(item.type);
};
