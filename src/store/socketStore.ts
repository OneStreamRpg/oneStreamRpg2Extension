import { create } from "zustand";
import { Socket } from "socket.io-client";

interface GameState {
  [key: string]: any; // Update with your actual game state structure
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  ingame: boolean; // Indicates if the user is in-game
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (state: boolean) => void;
  setGameState: (state: GameState) => void;
  setIngame: (state: boolean) => void; // Setter for ingame
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  gameState: null,
  ingame: false, // Default value for ingame
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) => set({ gameState }),
  setIngame: (ingame) => set({ ingame }), // Implementation of setIngame
}));
