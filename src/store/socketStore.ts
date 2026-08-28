import { Socket } from "socket.io-client";
import { create } from "zustand";
import { TownCapacityStatus } from "../types/townCapacity";

interface GameState {
  [key: string]: any; // You can refine this later
}

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  inGame: boolean;
  isDying: boolean;
  ping: number | null; // ✅ New: Current ping in ms
  streamDelay: number; // HLS latency to broadcaster in seconds
  pingToStreamer: number; // Server's ping to broadcaster in ms
  joinStatus: "idle" | "joining";
  joinError: string | null;
  joinGameFn: ((loginName: string) => void) | null;
  /** Town occupancy and Inn progress. Null until the server first reports it. */
  capacity: TownCapacityStatus | null;
  /** 1-based place in the join queue; null when not waiting. */
  queuePosition: number | null;
  queueLength: number;
  /** Why the viewer dropped out of the line — null when they left on purpose. */
  queueNotice: string | null;
  /** True only for the broadcaster, who joins a full town without queueing. */
  canBypassQueue: boolean;
  leaveQueueFn: (() => void) | null;
  /** null while discovery is still running. false = streamer isn't hosting. */
  lobbyOnline: boolean | null;
  /** Set when the socket cannot be established at all (bad URL, auth, outage). */
  connectionError: string | null;
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (state: boolean) => void;
  setGameState: (state: GameState) => void;
  setinGame: (state: boolean) => void;
  setIsDying: (state: boolean) => void;
  setPing: (ping: number) => void; // ✅ New: Setter for ping
  setStreamDelay: (delay: number) => void;
  setPingToStreamer: (ping: number) => void;
  setJoinStatus: (status: "idle" | "joining") => void;
  setJoinError: (error: string | null) => void;
  setJoinGameFn: (fn: (loginName: string) => void) => void;
  setCapacity: (capacity: TownCapacityStatus) => void;
  setQueueState: (position: number | null, queueLength: number) => void;
  setQueueNotice: (notice: string | null) => void;
  setCanBypassQueue: (canBypass: boolean) => void;
  setLeaveQueueFn: (fn: (() => void) | null) => void;
  setLobbyOnline: (online: boolean | null) => void;
  setConnectionError: (error: string | null) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  gameState: null,
  inGame: false,
  isDying: false,
  ping: null, // ✅ Initial value
  streamDelay: 0,
  pingToStreamer: 0,
  joinStatus: "idle",
  joinError: null,
  joinGameFn: null,
  capacity: null,
  queuePosition: null,
  queueLength: 0,
  queueNotice: null,
  canBypassQueue: false,
  leaveQueueFn: null,
  lobbyOnline: null,
  connectionError: null,
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) => set({ gameState }),
  setinGame: (inGame) => set({ inGame }),
  setIsDying: (isDying) => set({ isDying }),
  setPing: (ping) => set({ ping }), // ✅ Setter
  setStreamDelay: (delay) => set({ streamDelay: delay }),
  setPingToStreamer: (ping) => set({ pingToStreamer: ping }),
  setJoinStatus: (joinStatus) => set({ joinStatus }),
  setJoinError: (joinError) => set({ joinError }),
  setJoinGameFn: (fn) => set({ joinGameFn: fn }),
  setCapacity: (capacity) => set({ capacity }),
  setQueueState: (queuePosition, queueLength) => set({ queuePosition, queueLength }),
  setQueueNotice: (queueNotice) => set({ queueNotice }),
  setCanBypassQueue: (canBypassQueue) => set({ canBypassQueue }),
  setLeaveQueueFn: (fn) => set({ leaveQueueFn: fn }),
  setLobbyOnline: (lobbyOnline) => set({ lobbyOnline }),
  setConnectionError: (connectionError) => set({ connectionError }),
}));
