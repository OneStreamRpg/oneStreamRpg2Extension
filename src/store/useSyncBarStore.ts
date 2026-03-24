import { create } from "zustand";

interface SyncBarState {
  label: string;
  durationMs: number;
  startedAt: number;
}

interface SyncBarStore {
  bar: SyncBarState | null;
  show: (label: string, durationMs: number) => void;
  hide: () => void;
}

export const useSyncBarStore = create<SyncBarStore>((set) => ({
  bar: null,
  show: (label, durationMs) =>
    set({ bar: { label, durationMs, startedAt: Date.now() } }),
  hide: () => set({ bar: null }),
}));
