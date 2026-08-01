import { create } from "zustand";

/**
 * The factor UiScale is currently rendering the interface at.
 *
 * Published so things that have to live outside the scaled subtree — anything
 * positioned from viewport coordinates, like the drag ghost — can size
 * themselves to match the rest of the UI.
 */
type UiScaleStore = {
  scale: number;
  setScale: (scale: number) => void;
};

export const useUiScaleStore = create<UiScaleStore>((set) => ({
  scale: 1,
  setScale: (scale) => set((state) => (state.scale === scale ? state : { scale })),
}));
