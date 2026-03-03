import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { logger } from "../services/Logger";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { useNpcStore } from "../store/useNpcStore";
import { InteractData } from "../types/npcInteraction";
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
  "arena", "summon", "trade", "tradeItem",
  "stash", "stashPut", "stashGet", "stashSwap",
  "acceptQuest",
]);

interface UsePersonalChannelOptions {
  socket: Socket | null;
  isConnected: boolean;
  enabled?: boolean;
}

function getStreamSyncDelay(): number {
  const { streamDelay, pingToStreamer, ping } = useSocketStore.getState();
  return Math.max(0, 500 + streamDelay * 1000 - pingToStreamer / 2 + (ping ?? 0) / 2);
}

export function usePersonalChannel(options: UsePersonalChannelOptions) {
  const { socket, isConnected, enabled = true } = options;
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
          useNpcStore.getState().updatePopupData(popupData);
          useNpcStore.getState().setLoading(false);
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

    // Register event listeners
    socket.on("personalState:init", handleInit);
    socket.on("personalState:delta", handleDelta);
    socket.on("personalState:ack", handleAck);
    socket.on("personalState:sync", handleSync);
    socket.on("personalState:error", handleError);
    socket.on("personalState:event", handleEvent);

    // Cleanup
    return () => {
      socket.off("personalState:init", handleInit);
      socket.off("personalState:delta", handleDelta);
      socket.off("personalState:ack", handleAck);
      socket.off("personalState:sync", handleSync);
      socket.off("personalState:error", handleError);
      socket.off("personalState:event", handleEvent);
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

  return {
    isSubscribed,
    isReady,
  };
}
