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
  streamDelay: number; // HLS latency to broadcaster in seconds
  pingToStreamer: number; // Server's ping to broadcaster in ms
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (state: boolean) => void;
  setGameState: (state: GameState) => void;
  setinGame: (state: boolean) => void;
  setPing: (ping: number) => void; // ✅ New: Setter for ping
  setStreamDelay: (delay: number) => void;
  setPingToStreamer: (ping: number) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  gameState: null,
  inGame: false,
  ping: null, // ✅ Initial value
  streamDelay: 0,
  pingToStreamer: 0,
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) => set({ gameState }),
  setinGame: (inGame) => set({ inGame }),
  setPing: (ping) => set({ ping }), // ✅ Setter
  setStreamDelay: (delay) => set({ streamDelay: delay }),
  setPingToStreamer: (ping) => set({ pingToStreamer: ping }),
}));
