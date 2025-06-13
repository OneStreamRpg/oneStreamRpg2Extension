import { create } from "zustand";
import { Socket } from "socket.io-client";

interface GameState {
  [key: string]: any; // Update with your actual game state structure
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  inGame: boolean; // Indicates if the user is in-game
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (state: boolean) => void;
  setGameState: (state: GameState) => void;
  setinGame: (state: boolean) => void; // Setter for inGame
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  gameState: null,
  inGame: false, // Default value for inGame
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) => set({ gameState }),
  setinGame: (inGame) => set({ inGame }), // Implementation of setinGame
}));
