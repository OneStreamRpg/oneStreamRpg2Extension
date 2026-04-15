import { create } from "zustand";

export interface CastIndicatorEntry {
  id: number;
  aimX: number;
  aimY: number;
  abilityId: string;
  durationMs: number;
  startedAt: number;
}

interface CastIndicatorStore {
  indicators: CastIndicatorEntry[];
  show: (aimX: number, aimY: number, abilityId: string, durationMs: number) => void;
  hide: (id: number) => void;
  clearAll: () => void;
}

let nextId = 0;

export const useCastIndicatorStore = create<CastIndicatorStore>((set) => ({
  indicators: [],
  show: (aimX, aimY, abilityId, durationMs) =>
    set((state) => ({
      indicators: [
        ...state.indicators,
        { id: nextId++, aimX, aimY, abilityId, durationMs, startedAt: Date.now() },
      ],
    })),
  hide: (id) =>
    set((state) => ({ indicators: state.indicators.filter((i) => i.id !== id) })),
  clearAll: () => set({ indicators: [] }),
}));
