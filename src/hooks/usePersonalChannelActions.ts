import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { EquipmentSlotKey } from "../components/inventory/types";
import { logger } from "../services/Logger";
import { AbilitySlotType } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import {
  PersonalChannelAction,
  PlayerPersonalState
} from "../types/personalChannel";

const TAG = "PersonalChannelActions";

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
        logger.warn(TAG, "Cannot send action: channel not ready", {
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
      logger.debug(TAG, `Sending action: type=${action.type}, actionId=${action.actionId}`, action);
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


  const castAbility = useCallback((slotType: AbilitySlotType, aimX?: number, aimY?: number) => {
    sendAction(
      "castAbility",
      { slotType, ...(aimX !== undefined && aimY !== undefined ? { aimX, aimY } : {}) },
      (state) => {
        return state;
      }
    );
  }, [sendAction])

  const movePlayer = useCallback((x: number, y: number) => {
    sendAction(
      "movePlayer",
      { x, y } as { x: number, y: number },
      (state) => {
        return state;
      }
    );
  }, [sendAction])

  const setTargetEnemy = useCallback((id: string) => {
    sendAction(
      "setTargetEnemy",
      { id } as { id: string },
      (state) => {
        return state;
      }
    );
  }, [sendAction])

  const setTargetJobSpace = useCallback((id: string) => {
    sendAction(
      "setTargetJobSpace",
      { id } as { id: string },
      (state) => {
        return state;
      }
    );
  }, [sendAction])


  /**
   * Equip an ability to hotbar (server auto-detects slot from ability's slotType)
   */
  const equipAbility = useCallback(
    (abilityId: string) => {
      sendAction(
        "equipAbility",
        { abilityId },
        (state) => state
      );
    },
    [sendAction]
  );

  /**
   * Unequip an ability from a slot
   */
  const unequipAbility = useCallback(
    (slot: "main" | "second" | "ultimate") => {
      sendAction(
        "unequipAbility",
        { slot },
        (state) => state
      );
    },
    [sendAction]
  );

  /**
   * Get quests from server
   */
  const getQuests = useCallback(() => {
    sendAction("getQuests", {}, (state) => state);
  }, [sendAction]);

  /**
   * Cancel an active quest
   */
  const cancelQuest = useCallback(
    (questId: string) => {
      sendAction("cancelQuest", { questId }, (state) => state);
    },
    [sendAction]
  );

  const groupInvite = useCallback(
    (targetUsername: string) => {
      sendAction("groupInvite", { targetUsername }, (s) => s);
    },
    [sendAction]
  );

  const groupAccept = useCallback(
    (fromTwitchId: string) => {
      sendAction("groupAccept", { fromTwitchId }, (s) => ({
        ...s,
        pendingGroupInvites: (s.pendingGroupInvites ?? []).filter(
          (inv) => inv.fromTwitchId !== fromTwitchId
        ),
      }));
    },
    [sendAction]
  );

  const groupDecline = useCallback(
    (fromTwitchId: string) => {
      sendAction("groupDecline", { fromTwitchId }, (s) => ({
        ...s,
        pendingGroupInvites: (s.pendingGroupInvites ?? []).filter(
          (inv) => inv.fromTwitchId !== fromTwitchId
        ),
      }));
    },
    [sendAction]
  );

  const groupLeave = useCallback(() => {
    sendAction("groupLeave", {}, (s) => s);
  }, [sendAction]);

  const groupKick = useCallback(
    (targetUsername: string) => {
      sendAction("groupKick", { targetUsername }, (s) => s);
    },
    [sendAction]
  );

  const groupWithdraw = useCallback(
    (targetUsername: string) => {
      sendAction("groupWithdraw", { targetUsername }, (s) => ({
        ...s,
        outgoingGroupInvites: (s.outgoingGroupInvites ?? []).filter(
          (inv) => inv.toUsername !== targetUsername
        ),
      }));
    },
    [sendAction]
  );

  // ── Player-to-player trading ──────────────────────────────────────────
  // The backend drives `tradeSession`, invites and nearby lists via deltas, so
  // these actions optimistically remove the relevant invite where it makes the
  // UI feel responsive and otherwise pass state through unchanged.

  const tradeRequest = useCallback(
    (targetTwitchId: string) => {
      sendAction("tradeRequest", { targetTwitchId }, (s) => s);
    },
    [sendAction]
  );

  const tradeRespond = useCallback(
    (fromTwitchId: string, accept: boolean) => {
      sendAction("tradeRespond", { fromTwitchId, accept }, (s) => ({
        ...s,
        pendingTradeInvites: (s.pendingTradeInvites ?? []).filter(
          (inv) => inv.fromTwitchId !== fromTwitchId
        ),
      }));
    },
    [sendAction]
  );

  const tradeWithdraw = useCallback(
    (targetTwitchId: string) => {
      sendAction("tradeWithdraw", { targetTwitchId }, (s) => ({
        ...s,
        outgoingTradeInvites: (s.outgoingTradeInvites ?? []).filter(
          (inv) => inv.toTwitchId !== targetTwitchId
        ),
      }));
    },
    [sendAction]
  );

  const tradeUpdateOffer = useCallback(
    (items: { instanceId: string; quantity: number }[], gold: number = 0) => {
      sendAction("tradeUpdateOffer", { items, gold }, (s) => s);
    },
    [sendAction]
  );

  const tradeSetReady = useCallback(
    (ready: boolean) => {
      sendAction("tradeSetReady", { ready }, (s) => s);
    },
    [sendAction]
  );

  const tradeConfirm = useCallback(() => {
    sendAction("tradeConfirm", {}, (s) => s);
  }, [sendAction]);

  const tradeCancel = useCallback(() => {
    sendAction("tradeCancel", {}, (s) => s);
  }, [sendAction]);

  /**
   * Request full state sync
   */
  const requestSync = useCallback(() => {
    if (!socket) {
      logger.warn(TAG, "Cannot request sync: socket not available");
      return;
    }

    logger.info(TAG, "Requesting full state sync from server");
    socket.emit("personalChannel:requestSync");
  }, [socket]);

  return {
    equipItem,
    unequipItem,
    swapEquipment: swapEquipmentSlots,
    swapInventorySlots,
    equipAbility,
    unequipAbility,
    requestSync,
    movePlayer,
    castAbility,
    setTargetEnemy,
    setTargetJobSpace,
    getQuests,
    cancelQuest,
    groupInvite,
    groupAccept,
    groupDecline,
    groupLeave,
    groupKick,
    groupWithdraw,
    tradeRequest,
    tradeRespond,
    tradeWithdraw,
    tradeUpdateOffer,
    tradeSetReady,
    tradeConfirm,
    tradeCancel,
  };
}
