import { create } from "zustand";
import { useSettingsStore } from "./useSettingsStore";

/**
 * Drives the "you are here" highlight over the player.
 *
 * It stays up until the viewer closes it rather than timing out — dismissing it
 * is proof they actually found their character, which a fade they might have
 * been looking away from doesn't give us. It replays on every entry into the
 * world, since picking yourself out of a crowded spawn is the whole point;
 * viewers who don't want it turn it off in settings.
 */
type LocatePlayerStore = {
  visible: boolean;
  /** Bumped on every showing; the highlight replays from the top when it changes. */
  pingId: number;
  /** The player entered the world — join, respawn or reconnect. */
  announce: () => void;
  /** Viewer asked to be shown again (profile portrait). Shows even when off. */
  ping: () => void;
  dismiss: () => void;
};

export const useLocatePlayerStore = create<LocatePlayerStore>((set) => ({
  visible: false,
  pingId: 0,

  announce: () =>
    set((state) => ({
      visible: useSettingsStore.getState().showPlayerHere,
      pingId: state.pingId + 1,
    })),

  ping: () => set((state) => ({ visible: true, pingId: state.pingId + 1 })),

  dismiss: () => set({ visible: false }),
}));
