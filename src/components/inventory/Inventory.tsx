import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { logger } from "../../services/Logger";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { EquipmentSlot } from "./EquipmentSlot";
import {
  canEquipInSlot,
  getItemEquippedSlotTag,
  isEmptyItem,
} from "./inventoryService";
import { InventorySlot } from "./InventorySlot";
import { InventoryTooltip } from "./InventoryTooltip";
import { ItemDisplay } from "./ItemDisplay";
import { EQUIPMENT_SLOT_CONFIG, EquipmentSlotKey, Item } from "./types";
import { CalcBreakdown } from "../ui/CalcBreakdown";
import { ResolvedToken } from "../../utils/resolveScaling";

const TAG = "Inventory";

export const Inventory: React.FC = () => {
  // Get current game state
  const { displayedState } = usePersonalChannelStore();

  // Access socket and actions
  const socket = useSocketStore((state) => state.socket);
  const { swapInventorySlots, equipItem, unequipItem, swapEquipment } =
    usePersonalChannelActions(socket);

  logger.debug(TAG, "Rendering inventory", { displayedState });

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // State to hold the item being currently dragged.
  // This is used for highlighting compatible slots and for the DragOverlay.
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const item = active.data.current?.item ?? null;
    logger.debug(TAG, "Drag started", { itemId: item?.itemId, containerId: active.data.current?.containerId });
    setActiveItem(item);
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

      logger.info(TAG, `Swap inventory: slot ${activeIndex} <-> slot ${overIndex}`);
      swapInventorySlots(activeIndex, overIndex);
    }

    // Case 2: Inventory -> Equipment (Equip item)
    else if (isActiveInventory && isOverEquipment) {
      const activeIndex = parseInt(activeId.split("-")[1]);
      const overSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      //Check for compatibility
      if (!canEquipInSlot(overSlotKey, activeItem)) {
        logger.debug(TAG, `Equip blocked: item incompatible with slot ${overSlotKey}`);
        return;
      }

      logger.info(TAG, `Equip item: inventory[${activeIndex}] -> ${overSlotKey}`);
      equipItem(activeIndex, overSlotKey);
    }

    // Case 3: Equipment -> Inventory (Unequip item)
    else if (isActiveEquipment && isOverInventory) {
      const equipmentSlotKey = activeId.split("-")[1] as EquipmentSlotKey;
      const inventoryTargetIndex = parseInt(overId.split("-")[1]);

      const itemAtOver = inventoryItems[inventoryTargetIndex];

      if (!itemAtOver) {
        return;
      }

      // We need to check if the item in the inventory (if any)
      // is compatible with the equipment slot it's being swapped *from*.
      if (!isEmptyItem(itemAtOver)) {
        const itemTag = getItemEquippedSlotTag(itemAtOver);
        if (itemTag === null) {
          logger.debug(
            TAG,
            "Unequip blocked: no compatible tag found on item at target inventory slot"
          );
          return;
        }
        const isMatchingTag = itemTag === getItemEquippedSlotTag(activeItem);
        if (!isMatchingTag) {
          logger.debug(
            TAG,
            "Unequip blocked: incompatible tag found on item at target inventory slot"
          );
          return;
        }
      }

      logger.info(TAG, `Unequip item: ${equipmentSlotKey} -> inventory[${inventoryTargetIndex}]`);
      unequipItem(equipmentSlotKey, inventoryTargetIndex);
    }

    // Case 4: Equipment -> Equipment (Swap equipment)
    else if (isActiveEquipment && isOverEquipment) {
      const activeEquipmentSlotKey = activeId.split("-")[1] as EquipmentSlotKey;
      const overEquipmentSlotKey = overId.split("-")[1] as EquipmentSlotKey;

      const itemAtOver = equipmentSlots[overEquipmentSlotKey];

      // Check compatibility for both directions
      const isMovingItemCompatible = canEquipInSlot(
        overEquipmentSlotKey,
        activeItem
      );
      if (!isMovingItemCompatible) {
        logger.debug(TAG, `Equipment swap blocked: item incompatible with ${overEquipmentSlotKey}`);
        return;
      }
      const isSwappedItemCompatible =
        !itemAtOver || canEquipInSlot(activeEquipmentSlotKey, itemAtOver);
      if (!isSwappedItemCompatible) {
        logger.debug(TAG, `Equipment swap blocked: target item incompatible with ${activeEquipmentSlotKey}`);
        return;
      }
      logger.info(TAG, `Swap equipment: ${activeEquipmentSlotKey} <-> ${overEquipmentSlotKey}`);
      swapEquipment(activeEquipmentSlotKey, overEquipmentSlotKey);
    }
  }

  const equipmentSlotKeys = useMemo(
    () => Object.keys(EQUIPMENT_SLOT_CONFIG) as EquipmentSlotKey[],
    []
  );

  if (displayedState === null) {
    return <div>Loading inventory...</div>;
  }

  const inventoryItems = displayedState.inventory.items;
  const equipmentSlots = displayedState.equipment;
  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <section className="grid grid-cols-[auto_1fr_auto] gap-2 mb-4">
          <section className="flex flex-col items-center gap-y-2">
            {equipmentSlotKeys.slice(0, 5).map((slotKey) => (
              <EquipmentSlot
                key={slotKey}
                slotKey={slotKey}
                item={equipmentSlots[slotKey]}
                isDraggingActive={activeItem !== null}
              />
            ))}
          </section>
          <section className="w-full bg-[#1d1d1f] text-center text-xs">
            Player
            {Object.values(equipmentSlots)
              .filter((item) => item !== null && !isEmptyItem(item))
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
                isDraggingActive={activeItem !== null}
              />
            ))}
          </section>
        </section>
        <section className="grid grid-cols-4 gap-2">
          {inventoryItems.map((item, index) => (
            <InventorySlot key={index} index={index} item={item} isDraggingActive={activeItem !== null} />
          ))}
        </section>

        {/* Drag Overlay renders the item "ghost" that follows the mouse */}
        <DragOverlay>
          {activeItem ? <ItemDisplay item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      <Tooltip
        id="inventory-calc-tooltip"
        place="right"
        delayShow={0}
        render={({ activeAnchor }) => {
          const raw = activeAnchor?.getAttribute("data-breakdown");
          if (!raw) return null;
          try {
            return <CalcBreakdown resolved={JSON.parse(raw) as ResolvedToken} />;
          } catch {
            return null;
          }
        }}
      />
      <Tooltip
        id="inventory-tooltip"
        place="top"
        clickable
        delayShow={0}
        openEvents={{ mouseenter: true, focus: true, click: true }}
        hidden={Boolean(activeItem)}
        render={({ activeAnchor }) => {
          const itemId = activeAnchor?.getAttribute("data-item-id");
          if (!itemId) return null;

          const item =
            inventoryItems.find((i) => i?.id === itemId) ??
            Object.values(equipmentSlots).find((i) => i?.id === itemId);

          if (!item) return null;
          return <InventoryTooltip item={item} />;
        }}
      />
    </>
  );
};
