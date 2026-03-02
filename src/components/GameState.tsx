import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { usePersonalChannel } from "../hooks/usePersonalChannel";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { useSocketStore } from "../store/socketStore";

const TAG = "GameState";

interface Props {
  token: string;
  channelId: string;
  children: React.ReactNode;
}

const { VITE_SOCKET_URL } = import.meta.env;

// TODO MC: move world interaction layer out here.

export const GameState: React.FC<Props> = ({ token, channelId, children }) => {
  const {
    socket,
    isConnected,
    setSocket,
    setIsConnected,
    setGameState,
    setinGame,
    setPing,
  } = useSocketStore();

  // Initialize personal channel
  usePersonalChannel({
    socket,
    isConnected,
    enabled: true,
  });

  const streamDelayRef = useRef(0);
  const activeTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const updatePlayersState = (
    players: Array<{ id: string;[key: string]: any }>,
    previousPlayers: Array<{ id: string;[key: string]: any }>
  ) => {
    const playerMap = new Map(previousPlayers.map((p) => [p.id, p]));
    players.forEach((playerUpdate) => {
      const existingPlayer = playerMap.get(playerUpdate.id);
      if (existingPlayer) {
        Object.assign(existingPlayer, playerUpdate);
      }
    });
    logger.debug(TAG, "Updated players", Array.from(playerMap.values()));
    return Array.from(playerMap.values());
  };

  const updateEnemiesState = (
    enemies: Array<{ id: string;[key: string]: any }>,
    previousEnemies: Array<{ id: string;[key: string]: any }>
  ) => {
    const enemyMap = new Map(previousEnemies.map((e) => [e.id, e]));
    enemies.forEach((enemyUpdate) => {
      const existingEnemy = enemyMap.get(enemyUpdate.id);
      if (existingEnemy) {
        Object.assign(existingEnemy, enemyUpdate);
      }
    });
    logger.debug(TAG, "Updated enemies", Array.from(enemyMap.values()));
    return Array.from(enemyMap.values());
  };

  const updateNpcsState = (
    npcs: Array<{ id: string;[key: string]: any }>,
    previousNpcs: Array<{ id: string;[key: string]: any }>
  ) => {
    logger.debug(TAG, "NPC delta received", npcs);
    logger.debug(TAG, "Previous NPCs", previousNpcs);
    const npcMap = new Map(previousNpcs.map((npc) => [npc.id, npc]));
    npcs.forEach((npcUpdate) => {
      const existingNpc = npcMap.get(npcUpdate.id);
      if (existingNpc) {
        Object.assign(existingNpc, npcUpdate);
      } else {
        npcMap.set(npcUpdate.id, npcUpdate);
      }
    });
    logger.debug(TAG, "Updated NPCs", Array.from(npcMap.values()));
    return Array.from(npcMap.values());
  };

  useEffect(() => {
    // Pre-fetch game metadata at startup
    metadataService.fetchMetadata().catch((err) => {
      logger.error(TAG, "Failed to fetch metadata", err);
    });

    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onContext((context) => {
        if (context.hlsLatencyBroadcaster) {
          streamDelayRef.current = context.hlsLatencyBroadcaster;
          useSocketStore.getState().setStreamDelay(context.hlsLatencyBroadcaster);
        }
      });
    }
    logger.info(TAG, `Connecting to socket.io server at ${VITE_SOCKET_URL}`);
    const socketInstance: Socket = io(VITE_SOCKET_URL, {
      path: "/socket.io",
      // MC: Active in case you want to have a good log in dev console
      // transports: ["websocket"],
      auth: {
        token,
        channelId,
      },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      logger.info(TAG, "Connected to socket.io server");
      setIsConnected(true);
    });

    socketInstance.on("authenticated", () => {
      logger.info(TAG, "Authenticated with server");
    });

    socketInstance.on("disconnect", () => {
      logger.warn(TAG, "Disconnected from socket.io server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      logger.error(TAG, "Connection error", err);
    });

    socketInstance.on("gameState", (data) => {
      logger.info(TAG, "Initial game state received");
      logger.debug(TAG, "Game state received", { data });
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    socketInstance.on("inGame", (data) => {
      logger.info(TAG, `inGame state changed:`, data);
      if (data.inGame) {
        logger.info(TAG, `Player is now in-game, requesting initial game state...`, {
          channelId,
        });
        setinGame(data.inGame);
        socketInstance.emit("getGameState");
      } else {
        logger.info(TAG, `Player left the game, clearing game state`);
        setinGame(false);
        setGameState({ players: [], enemies: [], npcs: [] });
      }
    });

    socketInstance.on("gameStateDelta", (data) => {
      logger.debug(TAG, "Game state delta received", data);
      if (data.delta) {
        const pingToStreamer = data.delta.ping || 0;
        useSocketStore.getState().setPingToStreamer(pingToStreamer);
        const timeoutId = setTimeout(() => {
          const previousState = useSocketStore.getState().gameState;
          if (!previousState) {
            logger.warn(TAG, "No previous game state, skipping delta application");
            return
          };
          let players = [...(previousState.players || [])];
          let enemies = [...(previousState.enemies || [])];
          let npcs = [...(previousState.npcs || [])];

          if (data.delta.commands) {
            data.delta.commands.forEach((command: any) => {
              switch (command.event) {
                case "spawnEnemy":
                  if (command.enemy) enemies.push(command.enemy);
                  break;
                case "spawnPlayer":
                  if (command.player) players.push(command.player);
                  break;
                case "destroyEnemy":
                  enemies = enemies.filter((e) => e.id !== command.id);
                  break;
                case "kickPlayer":
                  players = players.filter((p) => p.id !== command.id);
                  break;
              }
            });
          }

          players = updatePlayersState(data.delta.players || [], players);
          enemies = updateEnemiesState(data.delta.enemies || [], enemies);
          npcs = updateNpcsState(data.delta.npcs || [], npcs);

          setGameState({
            ...previousState,
            players,
            enemies,
            npcs,
          });
        }, 500 + streamDelayRef.current * 1000 - pingToStreamer / 2 + (useSocketStore.getState().ping ?? 0) / 2);

        activeTimeouts.current.push(timeoutId);
      }
    });

    // ✅ PING SYSTEM: clean RTT measurement
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socketInstance.emit("ping");
      socketInstance.once("pong", () => {
        const latency = Date.now() - start;
        if (setPing) setPing(latency);
      });
    }, 3000);

    return () => {
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current = [];
      clearInterval(pingInterval);
      socketInstance.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
  }, [token, channelId, setSocket, setIsConnected, setGameState]);

  return <>{children}</>;
};
