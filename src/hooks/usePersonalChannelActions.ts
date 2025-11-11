import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import {
  EquipAbilityParams,
  EquipItemParams,
  PersonalChannelAction,
  PlayerPersonalState,
  SwapInventorySlotsParams,
  UnequipItemParams,
} from "../types/personalChannel";

/**
 * Hook for sending actions to the personal channel
 */
export function usePersonalChannelActions(socket: Socket | null) {
  const {
    displayedState,
    getNextSequence,
    applyOptimisticUpdate,
    isReady,
  } = usePersonalChannelStore();

  /**
   * Generic action sender with optimistic updates
   */
  const sendAction = useCallback(
    (
      type: string,
      params: Record<string, any>,
      optimisticStateCalculator: (state: PlayerPersonalState) => PlayerPersonalState
    ) => {
      if (!socket || !isReady || !displayedState) {
        console.warn("⚠️ Cannot send action: Not ready", {
          hasSocket: !!socket,
          isReady,
          hasState: !!displayedState,
        });
        return;
      }

      // Generate action ID and sequence
      const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const seq = getNextSequence();

      // Create action
      const action: PersonalChannelAction = {
        actionId,
        seq,
        type,
        params,
      };

      // Calculate optimistic state
      const optimisticState = optimisticStateCalculator(
        structuredClone(displayedState)
      );

      // Apply optimistic update
      applyOptimisticUpdate(action, optimisticState);

      // Send to server
      console.log("📤 Sending action", action);
      socket.emit("personalChannel:action", action);
    },
    [socket, isReady, displayedState, getNextSequence, applyOptimisticUpdate]
  );

  /**
   * Equip an item from inventory
   */
  const equipItem = useCallback(
    (slotNumber: number, targetLocation?: string) => {
      sendAction(
        "equipItem",
        { slotNumber, targetLocation } as EquipItemParams,
        (state) => {
          const item = state.inventory.items.find(
            (i) => i.slotNumber === slotNumber
          );

          if (!item) {
            console.warn("⚠️ Item not found in slot", slotNumber);
            return state;
          }

          // Determine equipment slot
          const slot = targetLocation || item.type;

          // Move to equipment
          if (slot in state.equipment) {
            state.equipment[slot as keyof typeof state.equipment] = {
              itemId: item.itemId,
              name: item.name,
              type: item.type,
              metadata: item.metadata,
            };
          }

          // Remove from inventory
          state.inventory.items = state.inventory.items.filter(
            (i) => i.slotNumber !== slotNumber
          );

          return state;
        }
      );
    },
    [sendAction]
  );

  /**
   * Unequip an item to inventory
   */
  const unequipItem = useCallback(
    (slotName: string) => {
      sendAction(
        "unequipItem",
        { slotName } as UnequipItemParams,
        (state) => {
          const equipped = state.equipment[slotName as keyof typeof state.equipment];

          if (!equipped) {
            console.warn("⚠️ No item equipped in slot", slotName);
            return state;
          }

          // Check if inventory has space
          if (state.inventory.items.length >= state.inventory.maxSize) {
            console.warn("⚠️ Inventory is full");
            return state;
          }

          // Find next available slot
          const usedSlots = state.inventory.items.map((i) => i.slotNumber);
          let nextSlot = 0;
          while (usedSlots.includes(nextSlot)) {
            nextSlot++;
          }

          // Add to inventory
          state.inventory.items.push({
            slotNumber: nextSlot,
            itemId: equipped.itemId,
            name: equipped.name,
            type: equipped.type,
            quantity: 1,
            metadata: equipped.metadata,
          });

          // Remove from equipment
          delete state.equipment[slotName as keyof typeof state.equipment];

          return state;
        }
      );
    },
    [sendAction]
  );

  /**
   * Swap two inventory slots
   */
  const swapInventorySlots = useCallback(
    (slot1: number, slot2: number) => {
      sendAction(
        "swapInventorySlots",
        { slot1, slot2 } as SwapInventorySlotsParams,
        (state) => {
          // const item1 = state.inventory.items.find((i) => i.slotNumber === slot1);
          // const item2 = state.inventory.items.find((i) => i.slotNumber === slot2);

          // // Swap slot numbers
          // if (item1) item1.slotNumber = slot2;
          // if (item2) item2.slotNumber = slot1;

          return state;
        }
      );
    },
    [sendAction]
  );

  /**
   * Equip an ability to hotbar
   */
  const equipAbility = useCallback(
    (slotIndex: number, abilityId: string) => {
      sendAction(
        "equipAbility",
        { slotIndex, abilityId } as EquipAbilityParams,
        (state) => {
          const hotbarSlot = state.abilities.hotbar.find(
            (h) => h.slot === slotIndex
          );

          if (!hotbarSlot) {
            console.warn("⚠️ Invalid hotbar slot", slotIndex);
            return state;
          }

          // Find ability in learned abilities
          const learned = state.abilities.learned.find(
            (l) => l.abilityId === abilityId
          );

          if (!learned) {
            console.warn("⚠️ Ability not learned", abilityId);
            return state;
          }

          // Update hotbar
          hotbarSlot.abilityId = abilityId;
          hotbarSlot.name = learned.name;

          return state;
        }
      );
    },
    [sendAction]
  );

  /**
   * Request full state sync
   */
  const requestSync = useCallback(() => {
    if (!socket) {
      console.warn("⚠️ Cannot request sync: No socket");
      return;
    }

    console.log("🔄 Requesting full state sync...");
    socket.emit("personalChannel:requestSync");
  }, [socket]);

  return {
    equipItem,
    unequipItem,
    swapInventorySlots,
    equipAbility,
    requestSync,
  };
}
