import React, { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useSocketStore } from "../store/socketStore";

interface Props {
  token: string;       // JWT token from Twitch
  channelId: string;   // Twitch Channel ID (broadcaster ID)
  children: React.ReactNode;
}

export const SocketProvider: React.FC<Props> = ({ token, channelId, children }) => {
  const { setSocket, setIsConnected, setGameState, setIngame,  } = useSocketStore();

  useEffect(() => {
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
      console.log("🎮 Game state received:", data);
      if (data.gameState) {
        setGameState(data.gameState);
      }
    });

    socketInstance.on("ingame", (data) => {
      console.log("🎮 Ingame state received:", data);
      if (data.ingame) {
        setIngame(data.ingame);
      }
      socketInstance.emit("getGameState", { channelId });
    });

    socketInstance.on("gameStateDelta", (data) => {
      console.log("🎮 Game state delta received:", data);
      if (data.delta) {
        const previousState = useSocketStore.getState().gameState;
        if (!previousState) {
          return;
        }

        // Process the delta to update the game state
        if (data.delta.commands) {
          loadCommands(data.delta.commands);
        }

        console.log("Previous state:", previousState);
        // Update players and enemies separately to avoid mutating other parts of the state
        const updatedPlayers = updatePlayersState(data.delta.players || [], previousState.players || []);
        const updatedEnemies = updateEnemiesState(data.delta.enemies || [], previousState.enemies || []);

        // Update the state only for players and enemies, keeping other state intact
        useSocketStore.setState((state) => ({
          gameState: {
            ...state.gameState,
            players: updatedPlayers,
            enemies: updatedEnemies,
            npcs : []
          }
        }));
        console.log("Updated players:", updatedPlayers);
        console.log("Updated enemies:", updatedEnemies);
      }
    });

    return () => {
      socketInstance.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
  }, [token, channelId, setSocket, setIsConnected, setGameState]);

  const loadCommands = (commands: Array<{ event: string; enemy?: any; player?: any; drop?: any }>) => {
    commands.forEach((command) => {
      if (command.event === "spawnEnemy" && command.enemy) {
        spawnEnemy(command.enemy);
      } else if (command.event === "spawnPlayer" && command.player) {
        spawnPlayer(command.player);
      }
    });
  };

  const spawnEnemy = (enemy: { enemyId: string; [key: string]: any }) => {
    const existingEnemies = useSocketStore.getState().gameState?.enemies || [];
    const newEnemies = [...existingEnemies, enemy];
    setGameState((prev: any) => ({
      ...prev,
      enemies: newEnemies,
    }));
  };

  const spawnPlayer = (player: { playerId: string; [key: string]: any }) => {
    const existingPlayers = useSocketStore.getState().gameState?.players || [];
    const newPlayers = [...existingPlayers, player];
    setGameState((prev: any) => ({
      ...prev,
      players: newPlayers,
    }));
  };

  const updatePlayersState = (
    players: Array<{ playerId: string; [key: string]: any }>,
    previousPlayers: Array<{ playerId: string; [key: string]: any }>
  ) => {
    players.forEach((player) => {
      const existingPlayer = previousPlayers.find((p) => p.playerId === player.playerId);
      if (existingPlayer) {
        Object.keys(player).forEach((key) => {
          existingPlayer[key] = player[key];
        });
      }
    });
    return previousPlayers;
  };

  const updateEnemiesState = (
    enemies: Array<{ enemyId: string; [key: string]: any }>,
    previousEnemies: Array<{ enemyId: string; [key: string]: any }>
  ) => {
    enemies.forEach((enemy) => {
      const existingEnemy = previousEnemies.find((e) => e.enemyId === enemy.enemyId);
      if (existingEnemy) {
        Object.keys(enemy).forEach((key) => {
          existingEnemy[key] = enemy[key];
        });
      }
    });
    return previousEnemies;
  };

  return <>{children}</>;
};
