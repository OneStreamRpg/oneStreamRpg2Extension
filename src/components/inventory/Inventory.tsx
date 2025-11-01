import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { EquipmentSlot } from "./EquipmentSlot";
import { isItemCompatible } from "./inventory";
import { InventorySlot } from "./InventorySlot";
import { ItemDisplay } from "./ItemDisplay";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

const INVENTORY_SIZE = 32;

const testingItems: Item[] = [
  { id: 'item-1', name: 'Iron Helmet', type: 'Helmet' },
  { id: 'item-8', name: 'Golden Helmet', type: 'Helmet' },
  { id: 'item-2', name: 'Steel Chestplate', type: 'Chest' },
  { id: 'item-3', name: 'Leather Boots', type: 'Boots' },
  { id: 'item-4', name: 'Ruby Ring', type: 'Ring' },
  { id: 'item-5', name: 'Broadsword', type: 'HoldableItem' },
];

export const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<(Item | null)[]>(() => {
    // MC: Debug itemss
    const initialItems = Array(INVENTORY_SIZE).fill(null);
    for (let i = 0; i < testingItems.length; i++) {
      initialItems[i] = testingItems[i];
    }
    return initialItems;
  });

  const [equipmentSlots, setEquipmentSlots] = useState<Record<EquipmentSlotKey, Item | null>>({
    helmet: null,
    chest: null,
    pants: null,
    boots: null,
    mainHand: null,
    amulet: null,
    gloves: null,
    firstRing: null,
    secondRing: null,
    offHand: null,
  });


  // State to hold the item being currently dragged.
  // This is used for highlighting compatible slots and for the DragOverlay.
  const [activeItem, setActiveItem] = useState<Item | null>(null);


  function handleDragStart(event: any) {
    const { active } = event;
    // Store the item being dragged
    setActiveItem(active.data.current?.item ?? null);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    // Clear the active item
    setActiveItem(null);

    // If dropped outside a valid droppable
    if (!over) {
      return;
    }

    const activeContainerId = active.data.current?.containerId;
    const activeItem = active.data.current?.item;
    const overId = over.id;

    // Don't do anything if we drop on the same slot
    if (activeContainerId === overId) {
      return;
    }

    const isActiveInventory = activeContainerId.startsWith('inventory-');
    const isOverInventory = overId.startsWith('inventory-');
    const isActiveEquipment = activeContainerId.startsWith('equipment-');
    const isOverEquipment = overId.startsWith('equipment-');

    // --- LOGIC TREE FOR ALL DRAG-AND-DROP SCENARIOS ---

    // Case 1: Inventory -> Inventory (Swap items)
    if (isActiveInventory && isOverInventory) {
      const activeIndex = parseInt(activeContainerId.split('-')[1]);
      const overIndex = parseInt(overId.split('-')[1]);

      setInventoryItems((items) => {
        const newItems = [...items];
        const itemAtOver = newItems[overIndex];
        newItems[overIndex] = activeItem;
        newItems[activeIndex] = itemAtOver; // Swap
        return newItems;
      });
    }

    // Case 2: Inventory -> Equipment (Equip item)
    else if (isActiveInventory && isOverEquipment) {
      const activeIndex = parseInt(activeContainerId.split('-')[1]);
      const overSlotKey = overId.split('-')[1] as EquipmentSlotKey;

      // Check for compatibility
      if (isItemCompatible(activeItem, overSlotKey)) {
        const itemAtOver = equipmentSlots[overSlotKey];

        // Update equipment
        setEquipmentSlots(prev => ({
          ...prev,
          [overSlotKey]: activeItem,
        }));

        // Update inventory (place equipped item back in bag)
        setInventoryItems(prev => {
          const newItems = [...prev];
          newItems[activeIndex] = itemAtOver; // Swap
          return newItems;
        });
      }
    }

    // Case 3: Equipment -> Inventory (Unequip item)
    else if (isActiveEquipment && isOverInventory) {
      const activeSlotKey = activeContainerId.split('-')[1] as EquipmentSlotKey;
      const overIndex = parseInt(overId.split('-')[1]);

      const itemAtOver = inventoryItems[overIndex];

      // We need to check if the item in the inventory (if any)
      // is compatible with the equipment slot it's being swapped *from*.
      if (itemAtOver && !isItemCompatible(itemAtOver, activeSlotKey)) {
        // Invalid swap
        return;
      }

      // Update inventory
      setInventoryItems(prev => {
        const newItems = [...prev];
        newItems[overIndex] = activeItem;
        return newItems;
      });

      // Update equipment
      setEquipmentSlots(prev => ({
        ...prev,
        [activeSlotKey]: itemAtOver, // Swap
      }));
    }

    // Case 4: Equipment -> Equipment (Swap equipment)
    else if (isActiveEquipment && isOverEquipment) {
      const activeSlotKey = activeContainerId.split('-')[1] as EquipmentSlotKey;
      const overSlotKey = overId.split('-')[1] as EquipmentSlotKey;

      const itemAtOver = equipmentSlots[overSlotKey];

      // Check compatibility for both directions
      const isMovingItemCompatible = isItemCompatible(activeItem, overSlotKey);
      const isSwappedItemCompatible = !itemAtOver || isItemCompatible(itemAtOver, activeSlotKey);

      if (isMovingItemCompatible && isSwappedItemCompatible) {
        // Swap
        setEquipmentSlots(prev => ({
          ...prev,
          [activeSlotKey]: itemAtOver,
          [overSlotKey]: activeItem,
        }));
      }
    }
  }

  const equipmentSlotKeys = useMemo(() => Object.keys(EQUIPMENT_SLOT_CONFIG) as EquipmentSlotKey[], []);


  return <DndContext
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
  >
    <div className="grid grid-cols-4">
      {equipmentSlotKeys.map(slotKey => (
        <EquipmentSlot
          key={slotKey}
          slotKey={slotKey}
          item={equipmentSlots[slotKey]}
          activeItem={activeItem}
        />
      ))}
    </div>

    <div className="grid grid-cols-4">
      {inventoryItems.map((item, index) => (
        <InventorySlot
          activeItem={activeItem}
          key={index}
          index={index}
          item={item}
        />
      ))}
    </div>

    {/* Drag Overlay renders the item "ghost" that follows the mouse */}
    <DragOverlay>
      {activeItem ? <ItemDisplay item={activeItem} /> : null}
    </DragOverlay>
  </DndContext>

}
