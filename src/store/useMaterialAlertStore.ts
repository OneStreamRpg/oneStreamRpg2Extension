import { create } from "zustand";
import { MaterialCategory } from "../components/inventory/types";

export type MaterialAlert = {
  /** Unique per showing, so a repeat raise replays the entry animation. */
  id: number;
  category: MaterialCategory;
};

type MaterialAlertStore = {
  alerts: MaterialAlert[];
  /** A material is full — either just filled up, or a pickup was discarded. */
  raise: (category: MaterialCategory) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

/**
 * How long a material stays quiet after being announced.
 *
 * Two sources feed `raise` and both can burst: crossing into the cap fires the
 * local watcher, and the server fires one event per discarded pickup — so a
 * node yielding three at cap arrives as three. Longer than the popup's own
 * 6s lifetime, so someone who keeps gathering while full gets reminded
 * periodically rather than looking at a permanent banner.
 */
const RAISE_COOLDOWN_MS = 15000;

const lastRaisedAt = new Map<MaterialCategory, number>();

export const useMaterialAlertStore = create<MaterialAlertStore>((set) => ({
  alerts: [],

  raise: (category) => {
    const now = Date.now();
    if (now - (lastRaisedAt.get(category) ?? 0) < RAISE_COOLDOWN_MS) return;
    lastRaisedAt.set(category, now);

    set((state) => ({
      // One row per material: capping wood twice shouldn't stack two identical
      // popups, it should just restart the one that's already up.
      alerts: [
        ...state.alerts.filter((alert) => alert.category !== category),
        { id: nextId++, category },
      ],
    }));
  },

  dismiss: (id) =>
    set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== id) })),
}));
