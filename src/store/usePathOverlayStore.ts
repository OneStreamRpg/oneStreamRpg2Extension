import { create } from "zustand";

export type PathTargetType = "enemy" | "npc" | undefined;

export interface Waypoint {
  x: number;
  y: number;
}

interface DeltaEntry {
  remainingPath: Waypoint[];
  applyAt: number;
}

interface PathOverlayStore {
  remainingPath: Waypoint[];
  targetType: PathTargetType;
  deltaQueue: DeltaEntry[];
  setPath: (path: Waypoint[], targetType?: PathTargetType) => void;
  enqueueDelta: (remainingPath: Waypoint[], applyAt: number) => void;
  processQueue: (now: number) => void;
  clearPath: () => void;
}

export const usePathOverlayStore = create<PathOverlayStore>((set, get) => ({
  remainingPath: [],
  targetType: undefined,
  deltaQueue: [],

  setPath: (path, targetType) => set({ remainingPath: path, targetType, deltaQueue: [] }),

  enqueueDelta: (remainingPath, applyAt) => {
    const { deltaQueue } = get();
    set({ deltaQueue: [...deltaQueue, { remainingPath, applyAt }] });
  },

  processQueue: (now) => {
    const { deltaQueue } = get();
    if (deltaQueue.length === 0) return;

    let i = 0;
    while (i < deltaQueue.length && deltaQueue[i].applyAt <= now) {
      i++;
    }
    if (i > 0) {
      set({
        remainingPath: deltaQueue[i - 1].remainingPath,
        deltaQueue: deltaQueue.slice(i),
      });
    }
  },

  clearPath: () => set({ remainingPath: [], deltaQueue: [] }),
}));
