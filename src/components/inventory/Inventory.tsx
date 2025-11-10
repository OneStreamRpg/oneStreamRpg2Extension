import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { EquipmentSlot } from "./EquipmentSlot";
import { isItemCompatible } from "./inventoryService";
import { InventorySlot } from "./InventorySlot";
import { ItemDisplay } from "./ItemDisplay";
import {
  EQUIPMENT_SLOT_CONFIG,
  EquipmentSlotKey,
  InventoryChangeEvent,
  Item,
} from "./types";

const INVENTORY_SIZE = 32;

const testingItems: Item[] = [
  { id: "item-1", name: "Iron Helmet", type: "Helmet", icon: "16_burger_dish" },
  { id: "item-8", name: "Golden Helmet", type: "Helmet", icon: "18_burrito" },
  { id: "item-2", name: "Steel Chestplate", type: "Chest", icon: "20_bagel" },
  { id: "item-3", name: "Leather Boots", type: "Boots", icon: "22_cheesecake" },
  { id: "item-4", name: "Ruby Ring", type: "Ring", icon: "26_chocolate" },
  {
    id: "item-5",
    name: "Broadsword",
    type: "HoldableItem",
    icon: "29_cookies_dish",
  },
  {
    id: "item-6",
    name: "Bat Sword",
    type: "HoldableItem",
    icon: "batSword",
  },
  {
    id: "item-7",
    name: "Emerald Amulet",
    type: "Amulet",
    icon: "30_chocolatecake",
  },
  {
    id: "item-9",
    name: "Silver Gloves",
    type: "Glove",
    icon: "27_chocolate_dish",
  },
  {
    id: "item-10",
    name: "Diamond Pants",
    type: "Pants",
    icon: "24_cheesepuff",
  },
];

export const Inventory: React.FC<{
  onInventoryChange?: (event: InventoryChangeEvent) => void;
}> = ({ onInventoryChange }) => {
  const [inventoryItems, setInventoryItems] = useState<(Item | null)[]>(() => {
    // MC: Debug itemss
    const initialItems = Array(INVENTORY_SIZE).fill(null);
    for (let i = 0; i < testingItems.length; i++) {
      initialItems[i] = testingItems[i];
    }
    return initialItems;
  });

  const [equipmentSlots, setEquipmentSlots] = useState<
    Record<EquipmentSlotKey, Item | null>
  >({
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

    const isActiveInventory = activeContainerId.startsWith("inventory-");
    const isOverInventory = overId.startsWith("inventory-");
    const isActiveEquipment = activeContainerId.startsWith("equipment-");
    const isOverEquipment = overId.startsWith("equipment-");

    // --- LOGIC TREE FOR ALL DRAG-AND-DROP SCENARIOS ---

    // Case 1: Inventory -> Inventory (Swap items)
    if (isActiveInventory && isOverInventory) {
      const activeIndex = parseInt(activeContainerId.split("-")[1]);
      const overIndex = parseInt(overId.split("-")[1]);

      let swappedItem: Item | null = null;
      setInventoryItems((items) => {
        const newItems = [...items];
        swappedItem = newItems[overIndex];
        newItems[overIndex] = activeItem;
        newItems[activeIndex] = swappedItem; // Swap
        return newItems;
      });

      onInventoryChange?.({
        type: "SWAP",
        item: activeItem,
        sourceId: activeContainerId,
        destinationId: overId,
        swappedItem,
      });
    }

    // Case 2: Inventory -> Equipment (Equip item)
    else if (isActiveInventory && isOverEquipment) {
      const activeIndex = parseInt(activeContainerId.split("-")[1]);
      const overSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      // Check for compatibility
      if (isItemCompatible(activeItem, overSlotKey)) {
        const itemAtOver = equipmentSlots[overSlotKey];

        // Update equipment
        setEquipmentSlots((prev) => ({
          ...prev,
          [overSlotKey]: activeItem,
        }));

        // Update inventory (place equipped item back in bag)
        setInventoryItems((prev) => {
          const newItems = [...prev];
          newItems[activeIndex] = itemAtOver; // Swap
          return newItems;
        });

        onInventoryChange?.({
          type: "EQUIP",
          item: activeItem,
          sourceId: activeContainerId,
          destinationId: overId,
          swappedItem: itemAtOver,
        });
      }
    }

    // Case 3: Equipment -> Inventory (Unequip item)
    else if (isActiveEquipment && isOverInventory) {
      const activeSlotKey = activeContainerId.split("-")[1] as EquipmentSlotKey;
      const overIndex = parseInt(overId.split("-")[1]);

      const itemAtOver = inventoryItems[overIndex];

      // We need to check if the item in the inventory (if any)
      // is compatible with the equipment slot it's being swapped *from*.
      if (itemAtOver && !isItemCompatible(itemAtOver, activeSlotKey)) {
        // Invalid swap
        return;
      }

      // Update inventory
      setInventoryItems((prev) => {
        const newItems = [...prev];
        newItems[overIndex] = activeItem;
        return newItems;
      });

      // Update equipment
      setEquipmentSlots((prev) => ({
        ...prev,
        [activeSlotKey]: itemAtOver, // Swap
      }));

      onInventoryChange?.({
        type: "UNEQUIP",
        item: activeItem,
        sourceId: activeContainerId,
        destinationId: overId,
        swappedItem: itemAtOver,
      });
    }

    // Case 4: Equipment -> Equipment (Swap equipment)
    else if (isActiveEquipment && isOverEquipment) {
      const activeSlotKey = activeContainerId.split("-")[1] as EquipmentSlotKey;
      const overSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      const itemAtOver = equipmentSlots[overSlotKey];

      // Check compatibility for both directions
      const isMovingItemCompatible = isItemCompatible(activeItem, overSlotKey);
      const isSwappedItemCompatible =
        !itemAtOver || isItemCompatible(itemAtOver, activeSlotKey);

      if (isMovingItemCompatible && isSwappedItemCompatible) {
        // Swap
        setEquipmentSlots((prev) => ({
          ...prev,
          [activeSlotKey]: itemAtOver,
          [overSlotKey]: activeItem,
        }));

        onInventoryChange?.({
          type: "SWAP_EQUIP",
          item: activeItem,
          sourceId: activeContainerId,
          destinationId: overId,
          swappedItem: itemAtOver,
        });
      }
    }
  }

  const equipmentSlotKeys = useMemo(
    () => Object.keys(EQUIPMENT_SLOT_CONFIG) as EquipmentSlotKey[],
    []
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <section className="grid grid-cols-[auto_1fr_auto] gap-2 mb-4">
        <section className="flex flex-col items-center gap-y-2">
          {equipmentSlotKeys.slice(0, 5).map((slotKey) => (
            <EquipmentSlot
              key={slotKey}
              slotKey={slotKey}
              item={equipmentSlots[slotKey]}
            />
          ))}
        </section>
        <section className="w-full bg-amber-400 text-center text-xs">
          Player
          {Object.values(equipmentSlots)
            .filter((item) => item)
            .map((item) => (
              <div key={item!.id}>{item!.name}</div>
            ))}
        </section>
        <section className="flex flex-col items-center gap-y-2">
          {equipmentSlotKeys.slice(5).map((slotKey) => (
            <EquipmentSlot
              key={slotKey}
              slotKey={slotKey}
              item={equipmentSlots[slotKey]}
            />
          ))}
        </section>
      </section>
      <section className="grid grid-cols-4 gap-2">
        {inventoryItems.map((item, index) => (
          <InventorySlot key={index} index={index} item={item} />
        ))}
      </section>

      {/* Drag Overlay renders the item "ghost" that follows the mouse */}
      <DragOverlay>
        {activeItem ? <ItemDisplay item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
