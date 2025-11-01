import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { useSocketStore } from "../../store/socketStore";
import InventorySlot from "../ui/InventorySlot";
import DraggableItem from "../ui/DraggableItem";

const PersonalInventory = () => {
  const { socket } = useSocketStore();
  const { displayedState, isReady, lastError } = usePersonalChannelStore();
  const { swapInventorySlots, equipItem, unequipItem } = usePersonalChannelActions(socket);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !displayedState) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dragging to equipment slot
    if (overId.startsWith("equip-")) {
      const fromSlot = parseInt(activeId);
      if (isNaN(fromSlot)) {
        console.warn("Invalid source slot for equipItem:", activeId);
        return;
      }
      const equipSlot = overId.replace("equip-", "");
      equipItem(fromSlot, equipSlot);
    } else {
      // Swap inventory slots
      const fromSlot = parseInt(activeId);
      const toSlot = parseInt(overId);

      if (isNaN(fromSlot) || isNaN(toSlot)) {
        console.warn("Invalid slot numbers for swap:", { fromSlot, toSlot, activeId, overId });
        return;
      }

      if (fromSlot === toSlot) return;

      swapInventorySlots(fromSlot, toSlot);
    }
  };

  if (!isReady || !displayedState) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">Loading inventory...</p>
      </div>
    );
  }

  const { inventory, equipment } = displayedState;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4 space-y-4">
        {/* Error Display */}
        {lastError && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-2 text-sm text-red-300">
            {lastError}
          </div>
        )}

        {/* Equipment Slots */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Equipment</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(equipment).map(([slotName, item]) => (
              <InventorySlot
                key={slotName}
                id={`equip-${slotName}`}
                onClick={() => item && unequipItem(slotName)}
              >
                {item && (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    <span title={item.name}>{item.name.substring(0, 3)}</span>
                  </div>
                )}
              </InventorySlot>
            ))}
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">
            Inventory ({inventory.items.length}/{inventory.maxSize})
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 40px)",
              gap: 4,
            }}
          >
            {inventory.items.map((item, index) => (
              <InventorySlot key={index} id={String(index)}>
                <DraggableItem id={String(index)}>
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs">
                    <span title={item.name}>{item.name.substring(0, 3)}</span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-gray-400">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                </DraggableItem>
              </InventorySlot>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, inventory.maxSize - inventory.items.length) }).map((_, index) => (
              <InventorySlot key={inventory.items.length + index} id={String(inventory.items.length + index)} />
            ))}
          </div>
        </div>

        {/* Currency Display */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-300">Currency</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">💰</span>
              <span className="text-gray-300">{displayedState.currency.gold}</span>
            </div>
            {displayedState.currency.gems !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-blue-400">💎</span>
                <span className="text-gray-300">{displayedState.currency.gems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Display */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-300">Stats</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">HP:</span>
              <span className="text-red-400">
                {displayedState.stats.hp}/{displayedState.stats.maxHp}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mana:</span>
              <span className="text-blue-400">
                {displayedState.stats.mana}/{displayedState.stats.maxMana}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Level:</span>
              <span className="text-gray-300">{displayedState.stats.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">XP:</span>
              <span className="text-purple-400">
                {displayedState.stats.xp}/{displayedState.stats.xpToNextLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Abilities Hotbar */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Abilities</h3>
          <div className="grid grid-cols-4 gap-2">
            {displayedState.abilities.hotbar.map((hotbarSlot) => (
              <InventorySlot key={hotbarSlot.slot} id={`ability-${hotbarSlot.slot}`}>
                {hotbarSlot.abilityId && (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    <span title={hotbarSlot.name || hotbarSlot.abilityId}>
                      {hotbarSlot.name?.substring(0, 3) || "???"}
                    </span>
                  </div>
                )}
              </InventorySlot>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default PersonalInventory;
