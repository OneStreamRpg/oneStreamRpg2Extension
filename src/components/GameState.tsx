import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { usePersonalChannel } from "../hooks/usePersonalChannel";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { useSocketStore } from "../store/socketStore";
import { useAimStore } from "../store/useAimStore";
import { useCastIndicatorStore } from "../store/useCastIndicatorStore";
import { useLocatePlayerStore } from "../store/useLocatePlayerStore";
import { useNpcStore } from "../store/useNpcStore";
import { usePathOverlayStore } from "../store/usePathOverlayStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSyncBarStore } from "../store/useSyncBarStore";
import { useUIStore } from "../store/useUIStore";
import { ActionAcknowledgment } from "../types/personalChannel";
import {
  InGameEvent,
  JoinResponseData,
  LeaveQueueData,
  QueueUpdateEvent,
  TownCapacityStatus,
} from "../types/townCapacity";
import { getStreamSyncDelay } from "../utils/streamSyncDelay";
import { API_BASE, fetchLobbyStatus, socketIoPathFor } from "../config/backend";

const TAG = "GameState";

interface Props {
  token: string;
  channelId: string;
  children: React.ReactNode;
}

// How often to re-check whether a streamer who wasn't hosting has launched the
// game since. Cheap GET, so a slow poll is plenty.
const LOBBY_POLL_MS = 10_000;

// TODO MC: move world interaction layer out here.

export const GameState: React.FC<Props> = ({ token, channelId, children }) => {
  const {
    socket,
    isConnected,
    inGame,
    setSocket,
    setIsConnected,
    setGameState,
    setinGame,
    setIsDying,
    setPing,
    setJoinStatus,
    setJoinError,
    setJoinGameFn,
    setLobbyOnline,
    setConnectionError,
    setCapacity,
    setQueueState,
    setQueueNotice,
    setCanBypassQueue,
    setLeaveQueueFn,
  } = useSocketStore();

  // The Twitch extension JWT is refreshed periodically by onAuthorized. Keeping
  // it in a ref (and handing socket.io a callback) means a refresh updates the
  // credential used for the next reconnect instead of tearing the socket down
  // and rebuilding the whole game state.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Initialize personal channel
  usePersonalChannel({
    socket,
    isConnected,
    enabled: true,
    inGame,
  });

  // Deltas are queued rather than each getting its own setTimeout. A timer per
  // delta meant a hidden tab (where timers are throttled but the socket keeps
  // delivering) built up hundreds of them, which then fired back to back on
  // return and re-rendered every step an enemy had taken. Draining the queue as
  // a batch collapses that into a single state update.
  const pendingDeltas = useRef<Array<{ delta: any; applyAt: number }>>([]);

  // When the game state is wiped (death, leave, disconnect) any still-pending
  // delta would land on the cleared state and partially repopulate it — which
  // makes the respawn path think it already has a valid state. Drop them
  // together with the state.
  const clearPendingDeltas = () => {
    pendingDeltas.current = [];
  };

  useEffect(() => {
    // Pre-fetch game metadata at startup
    metadataService.fetchMetadata().catch((err) => {
      logger.error(TAG, "Failed to fetch metadata", err);
    });

    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onContext((context: Partial<Twitch.ext.Context>) => {
        if (context.hlsLatencyBroadcaster) {
          useSocketStore.getState().setStreamDelay(context.hlsLatencyBroadcaster);
        }
      });
    }
    // Lobbies are routed by path off a single domain, so the broadcaster we
    // were loaded on decides which worker we reach. Discovery only exists so we
    // can tell "streamer isn't hosting" apart from "server is broken" —
    // connecting blind would leave the viewer on "Connecting…" forever.
    const socketPath = socketIoPathFor(channelId);
    logger.info(TAG, `Connecting to ${API_BASE} at ${socketPath}`);

    let cancelled = false;
    const checkLobby = () =>
      fetchLobbyStatus(channelId)
        .then(({ online }) => {
          if (!cancelled) setLobbyOnline(online);
        })
        .catch((err) => {
          if (cancelled) return;
          logger.error(TAG, "Lobby discovery failed", err);
          setConnectionError("Could not reach the OneStream RPG servers.");
        });

    checkLobby();
    const lobbyPollInterval = setInterval(checkLobby, LOBBY_POLL_MS);

    const socketInstance: Socket = io(API_BASE, {
      path: socketPath,
      // MC: Active in case you want to have a good log in dev console
      // transports: ["websocket"],
      // Callback rather than a literal: re-evaluated on every reconnect, so a
      // refreshed Twitch token is picked up automatically.
      auth: (cb) => cb({ token: tokenRef.current, channelId }),
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      logger.info(TAG, "Connected to socket.io server");
      setIsConnected(true);
      setJoinError(null);
      setConnectionError(null);
      setLobbyOnline(true);
      // Answers whether we are in-game AND where we stand in the queue, so a
      // viewer who queued from chat sees the waiting panel on open without
      // having to click Join first.
      socketInstance.emit("checkInGame");
    });

    socketInstance.on("authenticated", () => {
      logger.info(TAG, "Authenticated with server");
    });

    socketInstance.on("disconnect", () => {
      logger.warn(TAG, "Disconnected from socket.io server");
      setIsConnected(false);
      setinGame(false);
      clearPendingDeltas();
      setGameState({ enemies: [], npcs: [], jobSpaces: [] });
      useAimStore.getState().stopAim();
      useCastIndicatorStore.getState().clearAll();
      useSyncBarStore.getState().hide();
      usePathOverlayStore.getState().clearPath();
      usePlayerStore.getState().clear();
      useNpcStore.getState().closePopup();
    });

    const joinGame = (loginName: string) => {
      const actionId = `join-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setJoinStatus("joining");
      // Clear the previous attempt's error, or it sits under the spinner and
      // reads as if this retry had already failed.
      setJoinError(null);

      socketInstance.emit("personalChannel:action", {
        actionId,
        seq: 1,
        type: "join",
        params: { username: loginName },
      });

      const handleJoinAck = (data: ActionAcknowledgment) => {
        if (data.actionId !== actionId) return;
        socketInstance.off("personalState:ack", handleJoinAck);
        setJoinStatus("idle");

        const payload = data.data as JoinResponseData | undefined;
        if (payload?.capacity) setCapacity(payload.capacity);

        if (data.success || data.error === "Already in game") {
          setJoinError(null);
          setQueueState(null, payload?.capacity?.queueLength ?? 0);
          // Re-subscription is handled by usePersonalChannel watching inGame
          return;
        }

        // A full town answers success: false, but `queued` means the viewer
        // holds a place in line and gets pulled in automatically. That is the
        // waiting panel, not a red error.
        if (payload?.type === "queued" && payload.queued) {
          setJoinError(null);
          setQueueNotice(null);
          setQueueState(payload.position, payload.queueLength);
          return;
        }

        // queueFull and joinFailed both land here — nothing was reserved, so
        // the viewer is back to a plain retry.
        setQueueState(null, payload?.capacity?.queueLength ?? 0);
        setJoinError(data.error ?? "Failed to join game");
      };

      socketInstance.on("personalState:ack", handleJoinAck);
    };

    setJoinGameFn(joinGame);

    // Handled ahead of the player lookup server-side, so it works while the
    // viewer is only waiting and has no Player at all.
    const leaveQueue = () => {
      const actionId = `leaveQueue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      socketInstance.emit("personalChannel:action", {
        actionId,
        seq: 1,
        type: "leaveQueue",
        params: {},
      });

      const handleLeaveAck = (data: ActionAcknowledgment) => {
        if (data.actionId !== actionId) return;
        socketInstance.off("personalState:ack", handleLeaveAck);

        const payload = data.data as LeaveQueueData | undefined;
        if (payload?.capacity) setCapacity(payload.capacity);
        if (payload?.canBypassQueue !== undefined) {
          setCanBypassQueue(payload.canBypassQueue);
        }
        setQueueState(payload?.position ?? null, payload?.queueLength ?? 0);
        // They chose to leave, so there is nothing to explain to them.
        setQueueNotice(null);
      };

      socketInstance.on("personalState:ack", handleLeaveAck);
    };

    setLeaveQueueFn(leaveQueue);

    // Pushed to a waiting viewer every time the line moves.
    socketInstance.on("queueUpdate", (data: QueueUpdateEvent) => {
      logger.info(TAG, "Queue update", data);
      if (data.capacity) setCapacity(data.capacity);
      setQueueState(data.position, data.queueLength);

      if (data.position !== null) {
        setQueueNotice(null);
        return;
      }

      // Out of the line. No reason means they left on purpose and already
      // know why, so there is nothing to say.
      setQueueNotice(
        data.reason === "expired"
          ? "You waited 30 minutes without a spot opening, so you lost your place. Join again to get back in line."
          : data.reason === "failed"
            ? "Something went wrong while pulling you in. Join again to get back in line."
            : null
      );
    });

    // Only fires when occupancy actually changes — not part of the 16Hz delta.
    socketInstance.on("townCapacity", (capacity: TownCapacityStatus) => {
      setCapacity(capacity);
    });

    socketInstance.on("connect_error", (err) => {
      // Logger is disabled in production builds, so without this the viewer
      // sees an eternal "Connecting…" with nothing to explain it.
      logger.error(TAG, "Connection error", err);
      setConnectionError(err.message || "Could not connect to the game server.");
    });

    socketInstance.on("gameState", (data) => {
      logger.info(TAG, "Initial game state received");
      logger.debug(TAG, "Game state received", { data });
      if (data.gameState) {
        setGameState(data.gameState);
      }
      if (data.player) {
        console.log("[IndicatorDebug] gameState response includes player:", {
          hasHitbox: !!data.player.hitbox,
          player: data.player,
        });
        usePlayerStore.getState().setPlayer(data.player);
        // The only moment we know the player is standing in the world with a
        // known position — join, respawn and reconnect all land here.
        useLocatePlayerStore.getState().announce();
      } else {
        console.warn(
          "[IndicatorDebug] gameState response has NO player — sync bar will never draw. Response keys:",
          Object.keys(data ?? {})
        );
      }
    });

    socketInstance.on("inGame", (data: InGameEvent) => {
      //logger.info(TAG, `inGame state changed:`, data);
      // Additive fields: absent on the older shape, and enough on their own to
      // render the waiting panel for someone who queued from chat.
      if (data.capacity) setCapacity(data.capacity);
      if (data.queuePosition !== undefined) {
        setQueueState(data.queuePosition, data.queueLength ?? 0);
      }
      if (data.canBypassQueue !== undefined) setCanBypassQueue(data.canBypassQueue);

      if (data.inGame) {
        // `checkInGame` polls every 2s, so this fires repeatedly while alive.
        // Only (re)fetch when we are actually entering the world — after a
        // respawn the player snapshot is gone and `getGameState` is the only
        // thing that restores it along with enemies/jobSpaces.
        const wasInGame = useSocketStore.getState().inGame;
        const hasPlayer = !!usePlayerStore.getState().player;
        setIsDying(false);
        setinGame(data.inGame);
        // Being in the world and being in line are mutually exclusive, and
        // the promotion event carries no queuePosition to clear it — without
        // this, a stale position would resurface as a bogus waiting panel the
        // next time they left the game.
        setQueueState(null, data.queueLength ?? 0);
        setQueueNotice(null);
        // Pulled in off the queue rather than joining directly — worth calling
        // out, since from the viewer's side it happens with no input at all.
        if (data.fromQueue && !wasInGame) {
          useUIStore.getState().setWorldToast("A spot opened up — you're in!");
        }
        if (!wasInGame || !hasPlayer) {
          logger.info(TAG, `Player is now in-game, requesting initial game state...`, { channelId });
          socketInstance.emit("getGameState");
        }
      } else if (data.isDying) {
        logger.info(TAG, `Player is dying/respawning, waiting for respawn`);
        setIsDying(true);
        setinGame(false);
        clearPendingDeltas();
        setGameState({ enemies: [], npcs: [], jobSpaces: [] });
        usePlayerStore.getState().clear();
      } else {
        logger.info(TAG, `Player left the game, clearing game state`);
        setIsDying(false);
        setinGame(false);
        clearPendingDeltas();
        setGameState({ enemies: [], npcs: [], jobSpaces: [] });
        usePlayerStore.getState().clear();
      }
    });

    socketInstance.on("gameStateDelta", (data) => {
      logger.debug(TAG, "Game state delta received", data);
      if (!data.delta) return;
      useSocketStore.getState().setPingToStreamer(data.delta.ping || 0);
      pendingDeltas.current.push({
        delta: data.delta,
        applyAt: Date.now() + getStreamSyncDelay(),
      });
    });

    /**
     * Applies every delta whose stream-delay timer has elapsed as one update.
     *
     * `flushAll` ignores the timers entirely — used when the tab comes back,
     * where the player has jumped to live and everything still held back is
     * history we'd only be replaying.
     */
    const drainDeltas = (flushAll: boolean) => {
      const queue = pendingDeltas.current;
      if (queue.length === 0) return;

      if (!useSocketStore.getState().inGame) {
        logger.debug(TAG, "Not in-game (dying/left), dropping queued deltas");
        pendingDeltas.current = [];
        return;
      }

      const now = Date.now();
      let dueCount = 0;
      while (dueCount < queue.length && (flushAll || queue[dueCount].applyAt <= now)) {
        dueCount++;
      }
      if (dueCount === 0) return;

      const due = queue.slice(0, dueCount);
      pendingDeltas.current = queue.slice(dueCount);

      const previousState = useSocketStore.getState().gameState;
      if (!previousState) {
        logger.warn(TAG, "No previous game state, skipping delta application");
        return;
      }

      // Build the lookups once and fold every due delta through them, so the
      // cost is per delta rather than per delta per entity.
      const enemyMap = new Map<string, any>(
        (previousState.enemies || []).map((enemy: any) => [enemy.id, enemy])
      );
      const npcMap = new Map<string, any>(
        (previousState.npcs || []).map((npc: any) => [npc.id, npc])
      );
      let jobSpaces = previousState.jobSpaces ?? [];

      for (const { delta } of due) {
        if (delta.commands) {
          delta.commands.forEach((command: any) => {
            switch (command.event) {
              case "spawnEnemy":
                if (command.enemy) enemyMap.set(command.enemy.id, command.enemy);
                break;
              case "spawnNpc":
                if (command.npc) npcMap.set(command.npc.id, command.npc);
                break;
              case "destroyEnemy":
                enemyMap.delete(command.id);
                break;
            }
          });
        }

        (delta.enemies || []).forEach((update: any) => {
          const existing = enemyMap.get(update.id);
          if (existing) Object.assign(existing, update);
        });

        (delta.npcs || []).forEach((update: any) => {
          const existing = npcMap.get(update.id);
          if (existing) Object.assign(existing, update);
          else npcMap.set(update.id, update);
        });

        if (delta.jobSpaces) jobSpaces = delta.jobSpaces;
      }

      logger.debug(TAG, `Applied ${due.length} delta(s)`, { flushAll });
      setGameState({
        ...previousState,
        enemies: Array.from(enemyMap.values()),
        npcs: Array.from(npcMap.values()),
        jobSpaces,
      });
    };

    const deltaDrainInterval = setInterval(() => drainDeltas(false), 100);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      logger.info(TAG, "Tab visible again, flushing held-back state");
      drainDeltas(true);
      usePlayerStore.getState().flushQueue();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ✅ PING SYSTEM: clean RTT measurement
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socketInstance.emit("ping");
      socketInstance.once("pong", () => {
        const latency = Date.now() - start;
        if (setPing) setPing(latency);
      });
    }, 3000);

    const inGameCheckInterval = setInterval(() => {
      if (socketInstance.connected && useSocketStore.getState().inGame) {
        socketInstance.emit("checkInGame");
      }
    }, 2000);

    return () => {
      cancelled = true;
      pendingDeltas.current = [];
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(deltaDrainInterval);
      clearInterval(pingInterval);
      clearInterval(inGameCheckInterval);
      clearInterval(lobbyPollInterval);
      socketInstance.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
    // `token` is deliberately absent: it lives in tokenRef, so a Twitch token
    // refresh no longer rebuilds the socket and wipes the game state.
  }, [channelId, setSocket, setIsConnected, setGameState, setinGame, setIsDying, setJoinStatus, setJoinError, setJoinGameFn, setLobbyOnline, setConnectionError, setCapacity, setQueueState, setQueueNotice, setCanBypassQueue, setLeaveQueueFn]);

  return <>{children}</>;
};
