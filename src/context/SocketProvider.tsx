import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { usePersonalChannel } from "../hooks/usePersonalChannel";
import { useSocketStore } from "../store/socketStore";

interface Props {
  token: string;
  channelId: string;
  children: React.ReactNode;
}

const { VITE_SOCKET_URL } = import.meta.env;

export const SocketProvider: React.FC<Props> = ({
  token,
  channelId,
  children,
}) => {
  const { socket, isConnected, setSocket, setIsConnected, setGameState, setinGame, setPing } =
    useSocketStore();

  // Initialize personal channel
  usePersonalChannel({
    socket,
    isConnected,
    enabled: true,
  });

  const streamDelayRef = useRef(0);
  const activeTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onContext((context) => {
        if (context.hlsLatencyBroadcaster) {
          streamDelayRef.current = context.hlsLatencyBroadcaster;
        }
      });
    }
    console.log("🌍 Connecting to socket.io server at", VITE_SOCKET_URL);
    const socketInstance: Socket = io(VITE_SOCKET_URL, {
      path: "/socket.io",
      auth: {
        token,
        channelId,
      },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket.io server");
      setIsConnected(true);
    });

    socketInstance.on("authenticated", () => {
      console.log("✅ Authenticated with server");
    });

    socketInstance.on("disconnect", () => {
      console.warn("❌ Disconnected from socket.io server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("⚠️ Connection error:", err);
    });

    socketInstance.on("gameState", (data) => {
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    socketInstance.on("inGame", (data) => {
      console.log("✅ inGame state received:", data);
      if (data.inGame) {
        setinGame(data.inGame);
        socketInstance.emit("getGameState");
      } else {
        setinGame(false);
        setGameState({ players: [], enemies: [], npcs: [] });
      }
    });

    socketInstance.on("gameStateDelta", (data) => {
      if (data.delta) {
        const pingToStreamer = data.delta.ping || 0;
        const timeoutId = setTimeout(() => {
          const previousState = useSocketStore.getState().gameState;
          if (!previousState) return;
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
                  enemies = enemies.filter(
                    (e) => e.id !== command.id
                  );
                  break;
                case "kickPlayer":
                  players = players.filter(
                    (p) => p.id !== command.id
                  );
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
        console.log(`📡 Ping: ${latency}ms`);
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
    return Array.from(enemyMap.values());
  };

  const updateNpcsState = (
    npcs: Array<{ id: string;[key: string]: any }>,
    previousNpcs: Array<{ id: string;[key: string]: any }>
  ) => {
    const npcMap = new Map(previousNpcs.map((n) => [n.id, n]));
    npcs.forEach((npcUpdate) => {
      const existingNpc = npcMap.get(npcUpdate.id);
      if (existingNpc) {
        Object.assign(existingNpc, npcUpdate);
      } else {
        npcMap.set(npcUpdate.id, npcUpdate);
      }
    });
    return Array.from(npcMap.values());
  };

  return <>{children}</>;
};
