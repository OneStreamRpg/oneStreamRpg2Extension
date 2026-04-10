import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { logger } from "../services/Logger";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { useNpcStore } from "../store/useNpcStore";
import { usePathOverlayStore, Waypoint } from "../store/usePathOverlayStore";
import { useSyncBarStore } from "../store/useSyncBarStore";
import { useCastIndicatorStore } from "../store/useCastIndicatorStore";
import { InteractData } from "../types/npcInteraction";
import { useRecipesStore } from "../store/useRecipesStore";
import {
  ActionAcknowledgment,
  PlayerPersonalState,
  PlayerStateDelta,
} from "../types/personalChannel";

const TAG = "PersonalChannel";

// Data types that should update the NPC popup UI
const NPC_POPUP_TYPES = new Set<string>([
  "interact", "shop", "buy", "recipes", "buyRecipe", "craftList", "craft",
  "dialogue", "dialogueAnswer",
  "arena", "spawnArena", "summon", "trade", "tradeItem",
  "stash", "stashPut", "stashGet", "stashSwap",
  "acceptQuest", "questPreview", "confirmAcceptQuest", "declineQuest",
  "sellMenu", "sell", "sellMany",
]);

interface UsePersonalChannelOptions {
  socket: Socket | null;
  isConnected: boolean;
  enabled?: boolean;
  inGame?: boolean;
}

function getStreamSyncDelay(): number {
  const { streamDelay, pingToStreamer, ping } = useSocketStore.getState();
  return Math.max(0, 500 + streamDelay * 1000 - pingToStreamer / 2 + (ping ?? 0) / 2);
}

export function usePersonalChannel(options: UsePersonalChannelOptions) {
  const { socket, isConnected, enabled = true, inGame = false } = options;
  const hasSubscribed = useRef(false);
  const syncRequested = useRef(false);
  const interactDelayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isSubscribed,
    isReady,
    setSubscribed,
    setInitialState,
    applyDelta,
    confirmAction,
    rollbackAction,
    rollbackAllActions,
    setError,
    resetState,
  } = usePersonalChannelStore();

  // Subscribe to personal channel on connection
  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return;
    }

    // Subscribe only once
    if (!hasSubscribed.current) {
      logger.info(TAG, "Subscribing to personal channel");
      socket.emit("personalChannel:subscribe");
      hasSubscribed.current = true;
    }

    // Listen for initial state
    const handleInit = (data: { state: PlayerPersonalState; timestamp: number }) => {
      logger.info(TAG, "Initial state received from server", { data });
      setInitialState(data.state);
      setSubscribed(true);
      syncRequested.current = false;
    };

    // Listen for delta updates
    const handleDelta = (data: { delta: PlayerStateDelta; timestamp: number }) => {
      logger.debug(TAG, "Delta update received", { data });
      applyDelta(data.delta);
    };

    // Listen for unsolicited server events (e.g. async NPC interaction after walk-to)
    const handleEvent = (data: { event: string; data: any; timestamp: number }) => {
      logger.debug(TAG, `Personal state event received: event=${data.event}`, data);

      if (data.event === "castStart") {
        const delay = getStreamSyncDelay();
        useSyncBarStore.getState().show(data.data.name, delay);
        const { aimX, aimY, abilityId } = data.data;
        if (aimX !== undefined && aimY !== undefined) {
          useCastIndicatorStore.getState().show(aimX, aimY, abilityId, delay);
        }
        return;
      }

      if (data.event === "potStart") {
        useSyncBarStore.getState().show(data.data.name, getStreamSyncDelay());
        return;
      }

      if (data.event === "moveStart") {
        const path = data.data?.remainingPath as Waypoint[] | undefined;
        if (path) {
          usePathOverlayStore.getState().setPath(path, data.data?.targetType);
        }
        const targetType = data.data?.targetType as string | undefined;
        const label = targetType === "enemy" ? "Attacking..." : targetType === "npc" ? "Talking..." : "Moving...";
        const delay = getStreamSyncDelay();
        console.log("[SyncBar] moveStart received, delay=", delay, { targetType, label });
        useSyncBarStore.getState().show(label, delay);
        return;
      }

      if (data.event === "npcInteraction") {
        // Scenario B: player had to walk to the NPC — event fires when they arrive
        // Delay to sync with the stream visual
        const interactData = data.data as InteractData;
        if (interactDelayTimeout.current) clearTimeout(interactDelayTimeout.current);
        interactDelayTimeout.current = setTimeout(() => {
          useNpcStore.getState().openPopup(interactData.npcId, "interact", interactData);
          interactDelayTimeout.current = null;
        }, 0);
      }
    };

    // Listen for action acknowledgments
    const handleAck = (data: ActionAcknowledgment) => {
      logger.debug(TAG, `Action acknowledgment received: actionId=${data.actionId}, success=${data.success}`, data);

      if (data.success) {
        confirmAction(data.actionId, data.delta);
      } else {
        rollbackAction(data.actionId, data.error);
        // If the NPC popup is waiting for a response, surface the error
        if (useNpcStore.getState().isLoading) {
          useNpcStore.getState().setError(data.error ?? "Something went wrong.");
        }
      }

      // Route playerRecipes response to recipes store
      if (data.data?.type === "playerRecipes") {
        useRecipesStore.getState().setRecipes((data.data as any).recipes ?? []);
      }

      // Route transient UI data to NPC store (only for actual popup types)
      // Delay the initial "interact" popup to sync with stream, all others are instant
      if (data.data && NPC_POPUP_TYPES.has(data.data.type)) {
        const popupData = data.data;
        if (popupData.type === "interact") {
          // Scenario A: player was already in range — ACK carries interact data directly
          // Delay to sync with the stream visual
          if (interactDelayTimeout.current) clearTimeout(interactDelayTimeout.current);
          interactDelayTimeout.current = setTimeout(() => {
            const interactData = popupData as InteractData;
            useNpcStore.getState().openPopup(interactData.npcId, "interact", interactData);
            interactDelayTimeout.current = null;
          }, 0);
        } else {
          const currentType = useNpcStore.getState().activePopupType;

          // Buy actions: keep shop open and show a toast
          const toastTypes: Partial<Record<string, string[]>> = {
            buy: ["shop"],
            buyRecipe: ["recipes"],
          };

          // Stash actions: re-fetch stash data so both panels update in place
          const stashActionTypes = new Set(["stashPut", "stashGet", "stashSwap"]);

          if (toastTypes[popupData.type]?.includes(currentType ?? "")) {
            const msg = (popupData as any).message ?? "Done.";
            useNpcStore.getState().setToast(msg);
            useNpcStore.getState().setLoading(false);
          } else if (stashActionTypes.has(popupData.type) && currentType === "stash") {
            const npcId = (useNpcStore.getState().popupData as any)?.npcId;
            const { getNextSequence, applyOptimisticUpdate, displayedState } =
              usePersonalChannelStore.getState();
            if (npcId && socket && displayedState) {
              const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const seq = getNextSequence();
              const action = { actionId, seq, type: "stash", params: { npcId } };
              applyOptimisticUpdate(action, structuredClone(displayedState));
              useNpcStore.getState().setLoading(true);
              socket.emit("personalChannel:action", action);
            } else {
              useNpcStore.getState().setLoading(false);
            }
          } else {
            useNpcStore.getState().updatePopupData(popupData);
            useNpcStore.getState().setLoading(false);
          }
        }
      }
    };

    // Listen for sync responses
    const handleSync = (data: { state: PlayerPersonalState; timestamp: number }) => {
      logger.info(TAG, "Full state sync received from server", { data });
      setInitialState(data.state);
      syncRequested.current = false;
    };

    // Listen for errors
    const handleError = (data: { error: string }) => {
      logger.error(TAG, `Channel error: ${data.error}`, data);
      setError(data.error);
    };

    // Listen for player movement deltas (~20Hz) — buffered by stream delay
    const handlePlayerDelta = (data: { delta: { remainingPath: Waypoint[] }; timestamp: number }) => {
      const path = data.delta?.remainingPath;
      if (!path) return;
      const applyAt = Date.now() + getStreamSyncDelay();
      usePathOverlayStore.getState().enqueueDelta(path, applyAt);
    };

    // Register event listeners
    socket.on("personalState:init", handleInit);
    socket.on("personalState:delta", handleDelta);
    socket.on("personalState:ack", handleAck);
    socket.on("personalState:sync", handleSync);
    socket.on("personalState:error", handleError);
    socket.on("personalState:event", handleEvent);
    socket.on("personalState:playerDelta", handlePlayerDelta);

    // Cleanup
    return () => {
      socket.off("personalState:init", handleInit);
      socket.off("personalState:delta", handleDelta);
      socket.off("personalState:ack", handleAck);
      socket.off("personalState:sync", handleSync);
      socket.off("personalState:error", handleError);
      socket.off("personalState:event", handleEvent);
      socket.off("personalState:playerDelta", handlePlayerDelta);
      if (interactDelayTimeout.current) {
        clearTimeout(interactDelayTimeout.current);
        interactDelayTimeout.current = null;
      }
    };
  }, [
    socket,
    isConnected,
    enabled,
    setSubscribed,
    setInitialState,
    applyDelta,
    confirmAction,
    rollbackAction,
    setError,
  ]);

  // Handle reconnection
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleReconnect = () => {
      logger.info(TAG, "Reconnected to server, requesting state sync");
      hasSubscribed.current = false;
      rollbackAllActions();
      resetState();

      // Wait a bit for authentication, then subscribe
      setTimeout(() => {
        if (socket.connected && !syncRequested.current) {
          socket.emit("personalChannel:subscribe");
          hasSubscribed.current = true;
          syncRequested.current = true;
        }
      }, 100);
    };

    const handleDisconnect = () => {
      logger.warn(TAG, "Disconnected from server");
      setSubscribed(false);
      hasSubscribed.current = false;
    };

    socket.on("connect", handleReconnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleReconnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, enabled, rollbackAllActions, resetState, setSubscribed]);

  // When inGame becomes true, reset subscription and re-subscribe to get fresh in-game state
  useEffect(() => {
    if (!socket || !isConnected || !enabled || !inGame) return;

    logger.info(TAG, "Player joined game, re-subscribing to personal channel");
    hasSubscribed.current = false;
    rollbackAllActions();
    resetState();

    setTimeout(() => {
      if (socket.connected) {
        socket.emit("personalChannel:subscribe");
        hasSubscribed.current = true;
      }
    }, 100);
  }, [socket, isConnected, enabled, inGame, rollbackAllActions, resetState]);

  return {
    isSubscribed,
    isReady,
  };
}
