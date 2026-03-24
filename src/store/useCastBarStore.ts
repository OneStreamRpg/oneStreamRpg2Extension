import { create } from "zustand";

interface CastState {
  abilityName: string;
  castTimeMs: number;
  startedAt: number;
}

interface CastBarStore {
  cast: CastState | null;
  startCast: (abilityName: string, castTimeMs: number) => void;
  clearCast: () => void;
}

export const useCastBarStore = create<CastBarStore>((set) => ({
  cast: null,
  startCast: (abilityName, castTimeMs) =>
    set({ cast: { abilityName, castTimeMs, startedAt: Date.now() } }),
  clearCast: () => set({ cast: null }),
}));
