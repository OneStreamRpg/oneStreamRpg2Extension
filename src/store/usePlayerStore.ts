import { create } from "zustand";
import { Hitbox } from "../types/gameState";

export interface PlayerSnapshot {
  id: string;
  username: string;
  twitchId: string;
  level: number;
  hp: number;
  maxHp: number;
  hitbox: Hitbox;
}

type PlayerDelta = Partial<PlayerSnapshot>;

interface DeltaEntry {
  delta: PlayerDelta;
  applyAt: number;
}

interface PlayerStore {
  player: PlayerDelta | null;
  deltaQueue: DeltaEntry[];
  setPlayer: (player: PlayerSnapshot) => void;
  enqueueDelta: (delta: PlayerDelta, applyAt: number) => void;
  processQueue: (now: number) => void;
  /** Applies everything still held back, regardless of its stream-delay timer. */
  flushQueue: () => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: null,
  deltaQueue: [],

  setPlayer: (player) => set({ player, deltaQueue: [] }),

  enqueueDelta: (delta, applyAt) => {
    const { deltaQueue } = get();
    set({ deltaQueue: [...deltaQueue, { delta, applyAt }] });
  },

  processQueue: (now) => {
    const { deltaQueue, player } = get();
    if (deltaQueue.length === 0) return;

    let i = 0;
    while (i < deltaQueue.length && deltaQueue[i].applyAt <= now) {
      i++;
    }
    if (i === 0) return;

    let merged: PlayerDelta = player ?? {};
    for (let j = 0; j < i; j++) {
      merged = { ...merged, ...deltaQueue[j].delta };
    }
    set({
      player: merged,
      deltaQueue: deltaQueue.slice(i),
    });
  },

  // Nothing drains the queue while the tab is hidden (it runs off rAF), so on
  // return the backlog is all history. Collapse it in one go and carry on from
  // the newest state rather than walking through every step of it.
  flushQueue: () => {
    const { deltaQueue, player } = get();
    if (deltaQueue.length === 0) return;

    let merged: PlayerDelta = player ?? {};
    for (const entry of deltaQueue) {
      merged = { ...merged, ...entry.delta };
    }
    set({ player: merged, deltaQueue: [] });
  },

  clear: () => set({ player: null, deltaQueue: [] }),
}));
