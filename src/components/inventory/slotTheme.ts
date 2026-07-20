import { EquipmentSlotKey } from "./types";

// Shared frame style for inventory/equipment slots — matches the bevel look of
// AbilitiesNav empty slots and the LeftNav buttons.
export const SLOT_FRAME_STYLE: React.CSSProperties = {
  backgroundColor: "#231206",
  borderTop: "3px solid #9a7228",
  borderBottom: "3px solid #3d1a06",
  borderLeft: "3px solid #3d1a06",
  borderRight: "3px solid #3d1a06",
  boxShadow: [
    "inset 0 2px 0 rgba(255,220,120,0.12)",
    "inset 0 -4px 0 rgba(0,0,0,0.3)",
    "inset 0px 0px 20px -5px #0a0502",
    "0px 0px 8px 0px rgba(0,0,0,0.8)",
  ].join(", "),
};

// Placeholder icons shown semi-transparent in empty equipment slots.
// Only slots with an icon asset in media/img/icons are listed.
export const EQUIPMENT_SLOT_ICON: Partial<Record<EquipmentSlotKey, string>> = {
  helmet: "helmet",
  chest: "chest",
  pants: "pants",
  boots: "boots",
  gloves: "gloves",
};

export const EQUIPMENT_SLOT_LABEL: Record<EquipmentSlotKey, string> = {
  helmet: "Helmet",
  chest: "Chest",
  pants: "Pants",
  boots: "Boots",
  mainHand: "Weapon",
  amulet: "Amulet",
  gloves: "Gloves",
  firstRing: "Ring",
  secondRing: "Ring",
  backpack: "Backpack",
};
