
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
}
export type ItemType = 'Helmet' | 'Chest' | 'Pants' | 'Boots' | 'HoldableItem' | 'Amulet' | 'Glove' | 'Ring';

export type EquipmentSlotKey = 'helmet' | 'chest' | 'pants' | 'boots' | 'mainHand' | 'amulet' | 'gloves' | 'firstRing' | 'secondRing' | 'offHand';

export const EQUIPMENT_SLOT_CONFIG: Record<EquipmentSlotKey, { type: ItemType | ItemType[] }> = {
    helmet: { type: 'Helmet' },
    chest: { type: 'Chest' },
    pants: { type: 'Pants' },
    boots: { type: 'Boots' },
    mainHand: { type: 'HoldableItem' },
    amulet: { type: 'Amulet' },
    gloves: { type: 'Glove' },
    firstRing: { type: 'Ring' },
    secondRing: { type: 'Ring' },
    offHand: { type: 'HoldableItem' },
};

