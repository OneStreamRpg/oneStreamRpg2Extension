import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { logger } from "../services/Logger";
import { useNpcStore } from "../store/useNpcStore";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { PersonalChannelAction } from "../types/personalChannel";

const TAG = "NpcActions";

/**
 * Hook for NPC-related actions. All NPC actions use identity optimistic (no local state change).
 */
export function useNpcActions(socket: Socket | null) {
  const { isReady, displayedState, getNextSequence, applyOptimisticUpdate } =
    usePersonalChannelStore();

  const sendNpcAction = useCallback(
    (type: string, params: Record<string, any>) => {
      if (!socket || !isReady || !displayedState) {
        logger.warn(TAG, "Cannot send NPC action: channel not ready");
        return;
      }

      const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const seq = getNextSequence();

      const action: PersonalChannelAction = {
        actionId,
        seq,
        type,
        params,
      };

      // Identity optimistic — no state change
      applyOptimisticUpdate(action, structuredClone(displayedState));

      useNpcStore.getState().setLoading(true);

      logger.debug(TAG, `Sending NPC action: type=${type}`, action);
      socket.emit("personalChannel:action", action);
    },
    [socket, isReady, displayedState, getNextSequence, applyOptimisticUpdate]
  );

  // All indices are 1-based to match server API

  const interact = useCallback(
    (npcId?: string) => sendNpcAction("interact", { npcId }),
    [sendNpcAction]
  );

  const shop = useCallback(
    (npcId?: string) => sendNpcAction("shop", { npcId }),
    [sendNpcAction]
  );

  const buy = useCallback(
    (npcId: string, itemIndex: number) =>
      sendNpcAction("buy", { npcId, itemIndex }),
    [sendNpcAction]
  );

  const sell = useCallback(
    (npcId: string, slotIndex: number) =>
      sendNpcAction("sell", { npcId, slotIndex }),
    [sendNpcAction]
  );

  const sellMany = useCallback(
    (npcId: string, slotIndices: number[]) =>
      sendNpcAction("sellMany", { npcId, slotIndices }),
    [sendNpcAction]
  );

  const craftList = useCallback(
    (npcId?: string) => sendNpcAction("craftList", { npcId }),
    [sendNpcAction]
  );

  const craft = useCallback(
    (npcId: string, recipeIndex: number) =>
      sendNpcAction("craft", { npcId, recipeIndex }),
    [sendNpcAction]
  );

  const dialogue = useCallback(
    (npcId?: string) => sendNpcAction("dialogue", { npcId }),
    [sendNpcAction]
  );

  const dialogueAnswer = useCallback(
    (npcId: string, optionIndex: number) =>
      sendNpcAction("dialogueAnswer", { npcId, optionIndex }),
    [sendNpcAction]
  );

  const arena = useCallback(
    (npcId?: string) => sendNpcAction("arena", { npcId }),
    [sendNpcAction]
  );

  const spawnArena = useCallback(
    (npcId: string, stoneIndex: number) =>
      sendNpcAction("spawnArena", { npcId, stoneIndex }),
    [sendNpcAction]
  );

  const summon = useCallback(
    (npcId?: string) => sendNpcAction("summon", { npcId }),
    [sendNpcAction]
  );

  const summonEnemy = useCallback(
    (npcId: string, enemyIndex: number) =>
      sendNpcAction("summonEnemy", { npcId, enemyIndex }),
    [sendNpcAction]
  );

  const acceptQuest = useCallback(
    (npcId: string, questId: string) =>
      sendNpcAction("acceptQuest", { npcId, questId }),
    [sendNpcAction]
  );

  const questPreview = useCallback(
    (npcId: string, questId: string) =>
      sendNpcAction("questPreview", { npcId, questId }),
    [sendNpcAction]
  );

  const confirmAcceptQuest = useCallback(
    (npcId: string, questId: string) =>
      sendNpcAction("confirmAcceptQuest", { npcId, questId }),
    [sendNpcAction]
  );

  const declineQuest = useCallback(
    () => sendNpcAction("declineQuest", {}),
    [sendNpcAction]
  );

  const trade = useCallback(
    (npcId?: string) => sendNpcAction("trade", { npcId }),
    [sendNpcAction]
  );

  const tradeItem = useCallback(
    (npcId: string, tradeIndex: number) =>
      sendNpcAction("tradeItem", { npcId, tradeIndex }),
    [sendNpcAction]
  );

  const stash = useCallback(
    (npcId?: string) => sendNpcAction("stash", { npcId }),
    [sendNpcAction]
  );

  const stashPut = useCallback(
    (npcId: string, inventorySlot: number, stashSlot?: number) =>
      sendNpcAction("stashPut", { npcId, inventorySlot, stashSlot }),
    [sendNpcAction]
  );

  const stashGet = useCallback(
    (npcId: string, stashSlot: number, inventorySlot?: number) =>
      sendNpcAction("stashGet", { npcId, stashSlot, inventorySlot }),
    [sendNpcAction]
  );

  const stashSwap = useCallback(
    (npcId: string, stashSlot1: number, stashSlot2: number) =>
      sendNpcAction("stashSwap", { npcId, stashSlot1, stashSlot2 }),
    [sendNpcAction]
  );

  const npcUpgrade = useCallback(
    (npcId: string) => sendNpcAction("npcUpgrade", { npcId }),
    [sendNpcAction]
  );

  const npcDeposit = useCallback(
    (npcId: string, itemId: string, quantity: number) =>
      sendNpcAction("npcDeposit", { npcId, itemId, quantity }),
    [sendNpcAction]
  );

  const setTargetNpc = useCallback(
    (npcId: string) => {
      if (!socket || !isReady || !displayedState) {
        logger.warn(TAG, "Cannot send setTargetNpc: channel not ready");
        return;
      }

      const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const seq = getNextSequence();

      const action: PersonalChannelAction = {
        actionId,
        seq,
        type: "setTargetNpc",
        params: { id: npcId },
      };

      applyOptimisticUpdate(action, structuredClone(displayedState));

      logger.debug(TAG, `Setting target NPC: ${npcId}`);
      socket.emit("personalChannel:action", action);
    },
    [socket, isReady, displayedState, getNextSequence, applyOptimisticUpdate]
  );

  return {
    interact,
    shop,
    buy,
    sell,
    sellMany,
    craftList,
    craft,
    dialogue,
    dialogueAnswer,
    arena,
    spawnArena,
    summon,
    summonEnemy,
    acceptQuest,
    questPreview,
    confirmAcceptQuest,
    declineQuest,
    trade,
    tradeItem,
    stash,
    stashPut,
    stashGet,
    stashSwap,
    npcUpgrade,
    npcDeposit,
    setTargetNpc,
  };
}
