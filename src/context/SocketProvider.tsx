import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSocketStore } from "../store/socketStore";

interface Props {
  token: string;       // JWT token from Twitch
  channelId: string;   // Twitch Channel ID (broadcaster ID)
  children: React.ReactNode;
}

export const SocketProvider: React.FC<Props> = ({ token, channelId, children }) => {
  const { setSocket, setIsConnected, setGameState, setinGame } = useSocketStore();

  // ✅ Use ref for stream delay to avoid triggering re-renders
  const streamDelayRef = useRef(0);

  // ✅ Ref to track active timeouts for cleanup
  const activeTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // ✅ Setup Twitch context only once
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onContext((context) => {
        if (context.hlsLatencyBroadcaster) {
          streamDelayRef.current = context.hlsLatencyBroadcaster;
        }
      });
    }

    const socketInstance: Socket = io("https://germany.pauledevelopment.com:5321", {
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

    socketInstance.on("disconnect", () => {
      console.warn("❌ Disconnected from socket.io server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("⚠️ Connection error:", err.message);
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
      }
      else {
        setinGame(false);
        setGameState({ players: [], enemies: [], npcs: [] });
      }
    });

    // ✅ Delayed update for gameStateDelta using streamDelayRef
    socketInstance.on("gameStateDelta", (data) => {
      if (data.delta) {
        const timeoutId = setTimeout(() => {
          const previousState = useSocketStore.getState().gameState;
          if (!previousState) return;

          // Shallow copies
          let players = [...(previousState.players || [])];
          let enemies = [...(previousState.enemies || [])];
          let npcs = [...(previousState.npcs || [])];

          // Apply command-based mutations locally
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
                  console.log(`Removing enemy with ID: ${command.enemyId}`);
                  console.log("Current enemies before removal:", enemies);
                  enemies = enemies.filter(e => e.enemyId !== command.enemyId);
                  console.log("Current enemies after removal:", enemies);
                  break;
                case "kickPlayer":
                  players = players.filter(p => p.playerId !== command.playerId);
                  break;
              }
            });
          }

          // Apply delta changes
          players = updatePlayersState(data.delta.players || [], players);
          enemies = updateEnemiesState(data.delta.enemies || [], enemies);
          npcs = updateNpcsState(data.delta.npcs || [], npcs);

          // Final state update
          setGameState({
            ...previousState,
            players,
            enemies,
            npcs,
          });
        }, streamDelayRef.current * 1000);

        activeTimeouts.current.push(timeoutId);
      }
    });


    return () => {
      // ✅ Clean up timeouts and socket
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current = [];

      socketInstance.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
  }, [token, channelId, setSocket, setIsConnected, setGameState]); // ✅ NO streamDelay in deps

  const loadCommands = (commands: Array<{ event: string; enemy?: any; player?: any; enemyId?: string; playerId?: string; drop?: any }>) => {
    commands.forEach((command) => {
      console.log(`Processing command: ${command.event}`, command);
      switch (command.event) {
        case "spawnEnemy":
          if (command.enemy) spawnEnemy(command.enemy);
          break;
        case "spawnPlayer":
          if (command.player) spawnPlayer(command.player);
          break;
        case "destroyEnemy":
          if (command.enemyId) removeEnemy(command.enemyId);
          break;
        case "kickPlayer":
          if (command.playerId) removePlayer(command.playerId);
          break;
        default:
          console.warn(`Unhandled command: ${command.event}`);
      }
    });
  };

  const removeEnemy = (enemyId: string) => {
    console.log(`Removing enemy with ID: ${enemyId}`);
    console.log("Current enemies before removal:", useSocketStore.getState().gameState?.enemies);
    useSocketStore.setState((state) => ({
      gameState: {
        ...state.gameState,
        enemies: (state.gameState?.enemies || []).filter((e: { enemyId: string }) => e.enemyId !== enemyId),
      },
    }));
    console.log("Current enemies after removal:", useSocketStore.getState().gameState?.enemies);
  };

  const removePlayer = (playerId: string) => {
    useSocketStore.setState((state) => ({
      gameState: {
        ...state.gameState,
        players: (state.gameState?.players || []).filter((p: { playerId: string }) => p.playerId !== playerId),
      },
    }));
  };

  const spawnEnemy = (enemy: { enemyId: string;[key: string]: any }) => {
    useSocketStore.setState((state) => ({
      gameState: {
        ...state.gameState,
        enemies: [...(state.gameState?.enemies || []), enemy],
      },
    }));
  };

  const spawnPlayer = (player: { playerId: string;[key: string]: any }) => {
    useSocketStore.setState((state) => ({
      gameState: {
        ...state.gameState,
        players: [...(state.gameState?.players || []), player],
      },
    }));
  };

  const updatePlayersState = (
    players: Array<{ playerId: string;[key: string]: any }>,
    previousPlayers: Array<{ playerId: string;[key: string]: any }>
  ) => {
    const playerMap = new Map(previousPlayers.map(p => [p.playerId, p]));
    players.forEach(playerUpdate => {
      const existingPlayer = playerMap.get(playerUpdate.playerId);
      if (existingPlayer) {
        Object.assign(existingPlayer, playerUpdate);
      }
    });
    return Array.from(playerMap.values());
  };

  const updateEnemiesState = (
    enemies: Array<{ enemyId: string;[key: string]: any }>,
    previousEnemies: Array<{ enemyId: string;[key: string]: any }>
  ) => {
    const enemyMap = new Map(previousEnemies.map(e => [e.enemyId, e]));
    enemies.forEach(enemyUpdate => {
      const existingEnemy = enemyMap.get(enemyUpdate.enemyId);
      if (existingEnemy) {
        Object.assign(existingEnemy, enemyUpdate);
      }
    });
    return Array.from(enemyMap.values());
  };

  const updateNpcsState = (
    npcs: Array<{ npcId: string;[key: string]: any }>,
    previousNpcs: Array<{ npcId: string;[key: string]: any }>
  ) => {
    const npcMap = new Map(previousNpcs.map(n => [n.npcId, n]));
    npcs.forEach(npcUpdate => {
      const existingNpc = npcMap.get(npcUpdate.npcId);
      if (existingNpc) {
        Object.assign(existingNpc, npcUpdate);
      } else {
        npcMap.set(npcUpdate.npcId, npcUpdate);
      }
    });
    return Array.from(npcMap.values());
  };

  return <>{children}</>;
};
