import { Socket } from "socket.io-client";
import { create } from "zustand";

interface GameState {
  [key: string]: any; // You can refine this later
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  inGame: boolean;
  ping: number | null; // ✅ New: Current ping in ms
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (state: boolean) => void;
  setGameState: (state: GameState) => void;
  setinGame: (state: boolean) => void;
  setPing: (ping: number) => void; // ✅ New: Setter for ping
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  gameState: null,
  inGame: false,
  ping: null, // ✅ Initial value
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) => {
    console.log("Game state updated:", gameState);
    set({ gameState })
  },
  setinGame: (inGame) => set({ inGame }),
  setPing: (ping) => set({ ping }), // ✅ Setter
}));
