import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { EquipmentSlotKey } from "../components/inventory/types";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import {
  EquipAbilityParams,
  PersonalChannelAction,
  PlayerPersonalState,
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
  type EquipItemParams = {
    inventorySlotIndex: number
    equipmentSlotKey: string
  }
  const equipItem = useCallback(
    (inventorySlotIndex: number, equipmentSlotKey: EquipmentSlotKey) => {
      sendAction(
        "equipItem",
        { inventorySlotIndex, equipmentSlotKey } as EquipItemParams,
        (state) => {
          const item = state.inventory.items[inventorySlotIndex]!

          // Move to equipment
          state.equipment[equipmentSlotKey] = item;

          // Remove from inventory
          // MC: Can be set null because backend will place a new empty item here
          state.inventory.items[inventorySlotIndex] = null;

          return state;
        }
      );
    },
    [sendAction]
  );

  type SwapEquipmentSlotsParams = {
    slot1: EquipmentSlotKey
    slot2: EquipmentSlotKey
  }
  const swapEquipmentSlots = useCallback(
    (slot1: EquipmentSlotKey, slot2: EquipmentSlotKey) => {
      sendAction(
        "swapEquipmentSlots",
        { slot1, slot2 } as SwapEquipmentSlotsParams,
        (state) => {
          const item1 = state.equipment[slot1]!;
          const item2 = state.equipment[slot2]!;

          // Swap slot numbers
          state.equipment[slot2] = item1;
          state.equipment[slot1] = item2;

          return state
        }
      );
    },
    [sendAction]
  );


  /**
   * Unequip an item to inventory
   */
  type UnequipItemParams = {
    equipmentSlotKey: string
    inventoryTargetIndex: number
  }
  const unequipItem = useCallback(
    (equipmentSlotKey: EquipmentSlotKey, inventoryTargetIndex: number) => {
      sendAction(
        "unequipItem",
        { equipmentSlotKey, inventoryTargetIndex } as UnequipItemParams,
        (state) => {
          const item = state.equipment[equipmentSlotKey]!;

          // Move item to inventory
          state.inventory.items[inventoryTargetIndex] = item;

          // Remove from equipment
          // MC: Can be set null because backend will place a new empty item here
          state.equipment[equipmentSlotKey] = null;
          return state;
        }
      );
    },
    [sendAction]
  );

  /**
   * Swap two inventory slots
   */
  type SwapInventorySlotsParams = {
    slot1: number
    slot2: number
  }
  const swapInventorySlots = useCallback(
    (slot1: number, slot2: number) => {
      sendAction(
        "swapInventorySlots",
        { slot1, slot2 } as SwapInventorySlotsParams,
        (state) => {
          const item1 = state.inventory.items[slot1];
          const item2 = state.inventory.items[slot2];

          // Swap slot numbers
          if (item1) state.inventory.items[slot2] = item1;
          if (item2) state.inventory.items[slot1] = item2;

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
    swapEquipment: swapEquipmentSlots,
    swapInventorySlots,
    equipAbility,
    requestSync,
  };
}
