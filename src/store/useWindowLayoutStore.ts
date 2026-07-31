import { create } from "zustand";
import { ALL_WINDOW_IDS, WindowId } from "../types/windows";

const STORAGE_KEY = "osrpg.windowLayout.v1";

/**
 * Top-left corner of a window as a fraction (0..1) of the window layer.
 *
 * Fractions rather than pixels because the overlay is sized by the Twitch
 * player: a viewer who drags a window to the bottom-right in theatre mode
 * should still find it bottom-right after going fullscreen. Windows are still
 * clamped on render so a smaller player never pushes one off-screen.
 */
export type WindowPosition = { x: number; y: number };

type PersistedLayout = {
  positions: Partial<Record<WindowId, WindowPosition>>;
  order: WindowId[];
};

const isWindowId = (value: unknown): value is WindowId =>
  ALL_WINDOW_IDS.includes(value as WindowId);

const isPosition = (value: unknown): value is WindowPosition => {
  const pos = value as WindowPosition | null;
  return (
    !!pos &&
    typeof pos.x === "number" &&
    typeof pos.y === "number" &&
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y)
  );
};

const loadLayout = (): PersistedLayout => {
  const empty: PersistedLayout = { positions: {}, order: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<PersistedLayout>;

    const positions: PersistedLayout["positions"] = {};
    for (const [id, pos] of Object.entries(parsed.positions ?? {})) {
      if (isWindowId(id) && isPosition(pos)) positions[id] = pos;
    }

    const order = (parsed.order ?? []).filter(isWindowId);

    return { positions, order };
  } catch {
    // Blocked localStorage (Twitch iframe) or corrupted JSON — start clean.
    return empty;
  }
};

const saveLayout = (layout: PersistedLayout) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore write failures; the layout still applies for this session.
  }
};

type LayoutState = {
  /** Only holds windows that have an explicit spot — the rest fall back to their default anchor. */
  positions: Partial<Record<WindowId, WindowPosition>>;
  /** Stacking order, front-most last. */
  order: WindowId[];
  /** Windows placed from their default anchor this session, which we don't persist. */
  autoPlaced: WindowId[];
};

type LayoutActions = {
  setPosition: (id: WindowId, position: WindowPosition) => void;
  /** Seeds a window's spot from its default anchor without treating it as a viewer choice. */
  setAutoPosition: (id: WindowId, position: WindowPosition) => void;
  bringToFront: (id: WindowId) => void;
  /** Drops one window back onto its default anchor. */
  resetPosition: (id: WindowId) => void;
  resetLayout: () => void;
  hasCustomLayout: () => boolean;
};

const persistedSlice = (state: LayoutState): PersistedLayout => {
  const positions: PersistedLayout["positions"] = {};
  for (const [id, pos] of Object.entries(state.positions)) {
    if (isWindowId(id) && pos && !state.autoPlaced.includes(id)) {
      positions[id] = pos;
    }
  }
  return { positions, order: state.order };
};

const initial = loadLayout();

export const useWindowLayoutStore = create<LayoutState & LayoutActions>((set, get) => ({
  positions: initial.positions,
  order: initial.order,
  autoPlaced: [],

  setPosition: (id, position) => {
    set((state) => ({
      positions: { ...state.positions, [id]: position },
      // A drag makes the spot the viewer's own, so it stops being auto-placed.
      autoPlaced: state.autoPlaced.filter((placed) => placed !== id),
    }));
    saveLayout(persistedSlice(get()));
  },

  setAutoPosition: (id, position) => {
    set((state) => ({
      positions: { ...state.positions, [id]: position },
      autoPlaced: state.autoPlaced.includes(id)
        ? state.autoPlaced
        : [...state.autoPlaced, id],
    }));
  },

  bringToFront: (id) => {
    set((state) => {
      if (state.order[state.order.length - 1] === id) return state;
      return { order: [...state.order.filter((w) => w !== id), id] };
    });
    saveLayout(persistedSlice(get()));
  },

  resetPosition: (id) => {
    set((state) => {
      const positions = { ...state.positions };
      // Clearing it makes the window re-measure and re-anchor on the next
      // layout pass, same path as a first-ever appearance.
      delete positions[id];
      return {
        positions,
        autoPlaced: state.autoPlaced.filter((placed) => placed !== id),
      };
    });
    saveLayout(persistedSlice(get()));
  },

  resetLayout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // Clearing positions makes every window re-measure and drop back onto its
    // default anchor on the next frame.
    set({ positions: {}, order: [], autoPlaced: [] });
  },

  hasCustomLayout: () => {
    const state = get();
    return Object.keys(persistedSlice(state).positions).length > 0;
  },
}));
