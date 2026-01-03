import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { EquipmentSlot } from "./EquipmentSlot";
import { isItemCompatible } from "./inventoryService";
import { InventorySlot } from "./InventorySlot";
import { ItemDisplay } from "./ItemDisplay";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";

export const Inventory: React.FC = () => {
  // Get current game state
  const { displayedState } = usePersonalChannelStore();

  // Access socket and actions
  const socket = useSocketStore((state) => state.socket);
  const { swapInventorySlots, equipItem } = usePersonalChannelActions(socket);

  console.log("Inventory displayedState:", { displayedState });

  // State to hold the item being currently dragged.
  // This is used for highlighting compatible slots and for the DragOverlay.
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    // Store the item being dragged
    setActiveItem(active.data.current?.item ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Clear the active item
    setActiveItem(null);

    // If dropped outside a valid droppable
    if (!over) {
      return;
    }

    const activeId = active.data.current?.containerId;
    const overId = over.id as string;

    // Don't do anything if we drop on the same slot
    if (activeId === overId) {
      return;
    }

    const isActiveInventory = activeId.startsWith("inventory-");
    const isOverInventory = overId.startsWith("inventory-");
    const isActiveEquipment = activeId.startsWith("equipment-");
    const isOverEquipment = overId.startsWith("equipment-");

    const activeItem = active.data.current?.item;
    // --- LOGIC TREE FOR ALL DRAG-AND-DROP SCENARIOS ---

    // Case 1: Inventory -> Inventory (Swap items)
    if (isActiveInventory && isOverInventory) {
      const activeIndex = parseInt(activeId.split("-")[1]);
      const overIndex = parseInt(overId.split("-")[1]);

      swapInventorySlots(activeIndex, overIndex);
    }

    // Case 2: Inventory -> Equipment (Equip item)
    else if (isActiveInventory && isOverEquipment) {
      const activeIndex = parseInt(activeId.split("-")[1]);
      const overSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      //Check for compatibility
      if (!isItemCompatible(activeItem, overSlotKey)) {
        return;
      }

      equipItem(activeIndex, overSlotKey);
    }

    // Case 3: Equipment -> Inventory (Unequip item)
    else if (isActiveEquipment && isOverInventory) {
      const activeSlotKey = activeId.split("-")[1] as EquipmentSlotKey;
      const overIndex = parseInt(overId.split("-")[1]);

      const itemAtOver = inventoryItems[overIndex];

      // We need to check if the item in the inventory (if any)
      // is compatible with the equipment slot it's being swapped *from*.
      if (itemAtOver && !isItemCompatible(itemAtOver, activeSlotKey)) {
        // Invalid swap
        return;
      }

      // TODO: Unequip item
    }

    // Case 4: Equipment -> Equipment (Swap equipment)
    else if (isActiveEquipment && isOverEquipment) {
      const activeSlotKey = activeId.split("-")[1] as EquipmentSlotKey;
      const overSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      const itemAtOver = equipmentSlots[overSlotKey];

      // Check compatibility for both directions
      const isMovingItemCompatible = isItemCompatible(activeItem, overSlotKey);
      const isSwappedItemCompatible =
        !itemAtOver || isItemCompatible(itemAtOver, activeSlotKey);

      if (isMovingItemCompatible && isSwappedItemCompatible) {
        // Swap
        // TODO: Swap items
      }
    }
  }

  const equipmentSlotKeys = useMemo(
    () => Object.keys(EQUIPMENT_SLOT_CONFIG) as EquipmentSlotKey[],
    []
  );

  // Collect all items for tooltip rendering
  //   const allItems = useMemo(() => {
  //     const items: Item[] = [];
  //     // Add inventory items
  //     inventoryItems.forEach((item) => {
  //       if (item) items.push(item);
  //     });
  //     // Add equipment items
  //     Object.values(equipmentSlots).forEach((item) => {
  //       if (item) items.push(item);
  //     });
  //     return items;
  //   }, [inventoryItems, equipmentSlots]);

  if (displayedState === null) {
    return <div>Loading inventory...</div>;
  }

  const inventoryItems = displayedState.inventory.items;
  const equipmentSlots = displayedState.equipment;
  return (
    <>
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
          <section className="w-full bg-[#1d1d1f] text-center text-xs">
            Player
            {Object.values(equipmentSlots)
              .filter((item) => item)
              .map((item) => (
                <div key={item!.id}>
                  {item!.itemId}: {item!.quantity}
                </div>
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

      {/* Tooltips rendered outside of dragging context */}
      {/* {!activeItem &&
        allItems.map((item) => (
          <Tooltip
            key={`tooltip-${item.id}`}
            id={`item-tooltip-${item.id}`}
            place="bottom"
            clickable
            delayShow={200}
            anchorSelect={`[data-item-id="${item.id}"]`}
          >
            <p>Debug</p>
          </Tooltip>
        ))} */}
    </>
  );
};
