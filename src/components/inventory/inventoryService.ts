import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey } from "./types";

export const isItemCompatible = (
  item: any,
  slotKey: EquipmentSlotKey
): boolean => {
  const slotConfig = EQUIPMENT_SLOT_CONFIG[slotKey];

  const allowedTypes = Array.isArray(slotConfig.type)
    ? slotConfig.type
    : [slotConfig.type];

  return allowedTypes.some((allowedType) =>
    item.tags.includes(allowedType)
  );

};
