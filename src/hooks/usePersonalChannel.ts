import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { logger } from "../services/Logger";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useNpcStore } from "../store/useNpcStore";
import { usePathOverlayStore, Waypoint } from "../store/usePathOverlayStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSyncBarStore } from "../store/useSyncBarStore";
import { useCastIndicatorStore } from "../store/useCastIndicatorStore";
import { GambleData, InteractData, NpcDepositData, NpcUpgradeData } from "../types/npcInteraction";
import { useUIStore } from "../store/useUIStore";
import { getStreamSyncDelay } from "../utils/streamSyncDelay";
import {
  ActionAcknowledgment,
  PlayerPersonalState,
  PlayerStateDelta,
} from "../types/personalChannel";

const TAG = "PersonalChannel";

// Data types that should update the NPC popup UI
const NPC_POPUP_TYPES = new Set<string>([
  "interact", "shop", "buy", "craftList", "craft",
  "dialogue", "dialogueAnswer",
  "arena", "spawnArena", "summon", "trade", "tradeItem",
  "stash", "stashPut", "stashGet", "stashSwap",
  "acceptQuest", "questPreview", "confirmAcceptQuest", "declineQuest",
  "sellMenu", "sell", "sellMany",
  "npcUpgrade",
]);

interface UsePersonalChannelOptions {
  socket: Socket | null;
  isConnected: boolean;
  enabled?: boolean;
  inGame?: boolean;
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
        const label =
          targetType === "enemy" ? "Attacking..."
          : targetType === "npc" ? "Talking..."
          : targetType === "jobSpace" ? "Farming..."
          : "Moving...";
        const delay = getStreamSyncDelay();
        console.log("[SyncBar] moveStart received, delay=", delay, { targetType, label });
        useSyncBarStore.getState().show(label, delay);
        return;
      }

      if (data.event === "jobSpaceError") {
        const reason = data.data?.reason as string | undefined;
        if (reason) {
          useUIStore.getState().setWorldToast(reason, true);
        }
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
        return;
      }

      // ── Player-to-player trading (fire-once outcomes) ──────────────────
      // The inventory/gold and `tradeSession` are updated via delta; these just
      // surface a human-readable toast.
      if (data.event === "tradeCompleted") {
        const partner = data.data?.partnerUsername;
        useUIStore.getState().setWorldToast(
          partner ? `Trade with ${partner} completed!` : "Trade completed!"
        );
        return;
      }

      if (data.event === "tradeCancelled") {
        const reason = data.data?.reason as string | undefined;
        useUIStore.getState().setWorldToast(reason || "Trade cancelled.", true);
        return;
      }

      if (data.event === "tradeDeclined") {
        const by = data.data?.byUsername;
        useUIStore.getState().setWorldToast(
          by ? `${by} declined your trade invite.` : "Trade invite declined.",
          true
        );
        return;
      }

      if (data.event === "tradeError") {
        const reason = data.data?.reason as string | undefined;
        useUIStore.getState().setWorldToast(reason || "Trade failed.", true);
        return;
      }

    };

    // Listen for action acknowledgments
    const handleAck = (data: ActionAcknowledgment) => {
      logger.debug(TAG, `Action acknowledgment received: actionId=${data.actionId}, success=${data.success}`, data);

      // Action types that should show an inline red toast instead of replacing the popup
      const toastableFailureTypes = new Set(["buy", "craft", "sell", "tradeItem",
        "stashPut", "stashGet", "stashSwap", "acceptQuest", "confirmAcceptQuest"]);

      const ackType = (data as any).type ?? data.data?.type;
      const isTradeAck = typeof ackType === "string" && ackType.startsWith("trade");

      if (data.success) {
        useUIStore.getState().setGroupError(null);
        if (isTradeAck) useUIStore.getState().setTradeError(null);
        confirmAction(data.actionId, data.delta);
      } else {
        rollbackAction(data.actionId, data.error);
        const actionType = (data as any).type ?? data.data?.type;
        const npcIsLoading = useNpcStore.getState().isLoading;
        if (npcIsLoading && actionType && toastableFailureTypes.has(actionType)) {
          // Keep the list popup open, show a red toast
          useNpcStore.getState().setToast(data.error ?? "Something went wrong.", true);
          useNpcStore.getState().setLoading(false);
        } else if (npcIsLoading) {
          useNpcStore.getState().setError(data.error ?? "Something went wrong.");
        }
        if (isTradeAck) {
          useUIStore.getState().setTradeError(data.error ?? "Something went wrong.");
        } else {
          useUIStore.getState().setGroupError(data.error ?? "Something went wrong.");
        }
      }

      // Route npcDeposit responses: refresh the upgrade popup in-place and show a toast
      if (data.data?.type === "npcDeposit") {
        const d = data.data as NpcDepositData;
        if (!d.success) {
          useNpcStore.getState().setToast(d.message, true);
          useNpcStore.getState().setLoading(false);
        } else {
          const currentData = useNpcStore.getState().popupData as NpcUpgradeData | null;
          if (currentData?.type === "npcUpgrade") {
            useNpcStore.getState().updatePopupData({
              type: "npcUpgrade",
              npcId: d.npcId,
              name: currentData.name,
              level: d.newLevel,
              maxLevel: !d.upgradeRequirements,
              depositedAmounts: d.depositedAmounts,
              upgradeRequirements: d.upgradeRequirements,
              // On upgraded=true the description refers to the level just reached
              // (shown in the toast below), so don't carry it into the panel state.
              upgradeDescription: d.upgraded ? undefined : d.upgradeDescription,
              dependencies: d.dependencies,
              dependenciesMet: d.dependenciesMet,
            });
          }
          if (d.upgraded) {
            const desc = d.upgradeDescription?.trim();
            useNpcStore
              .getState()
              .setToast(
                desc
                  ? `Upgraded to level ${d.newLevel}! ${desc}`
                  : `Upgraded to level ${d.newLevel}!`
              );
          } else {
            useNpcStore.getState().setToast(d.message);
          }
          useNpcStore.getState().setLoading(false);
        }
      }

      // Route gamble outcomes: the inventory delta is applied via confirmAction
      // above; here we hand the resolved flip to the NpcGamble menu (which drives
      // the win/lose animation off it) and toast the reason on a rejected wager.
      if (data.data?.type === "gamble") {
        const g = data.data as GambleData;
        useNpcStore.getState().setGambleResult(g);
        useNpcStore.getState().setLoading(false);
        if (!g.success) {
          useNpcStore.getState().setToast(g.message, true);
        }
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

          // Buy/craft actions: keep the list open and show a toast
          const toastTypes: Partial<Record<string, string[]>> = {
            buy: ["shop"],
            craft: ["craftList"],
          };

          // Stash actions: re-fetch stash data so both panels update in place
          const stashActionTypes = new Set(["stashPut", "stashGet", "stashSwap"]);

          if (toastTypes[popupData.type]?.includes(currentType ?? "")) {
            const isPayloadError = (popupData as any).success === false;
            const msg = (popupData as any).message ?? (isPayloadError ? "Something went wrong." : "Done.");
            useNpcStore.getState().setToast(msg, isPayloadError);
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
    // May also carry ability cooldown updates (e.g. auto-attack passive shaving CD)
    const handlePlayerDelta = (data: { delta: any; timestamp: number }) => {
      const delta = data.delta ?? {};
      const path = delta.remainingPath as Waypoint[] | undefined;
      const applyAt = Date.now() + getStreamSyncDelay();

      if (path) {
        usePathOverlayStore.getState().enqueueDelta(path, applyAt);
      }
      if (delta.abilities !== undefined) {
        applyDelta({ versions: {}, abilities: delta.abilities });
      }

      const { remainingPath: _rp, abilities: _ab, ...playerKeys } = delta;
      if (Object.keys(playerKeys).length > 0) {
        usePlayerStore.getState().enqueueDelta(playerKeys, applyAt);
      }
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
