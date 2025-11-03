import { create } from "zustand";
import { Page, PagePosition } from "../types/ui";

type UIState = {
  activePage: Page | null;
  pagePosition: PagePosition;
  debugInventoryInfo: boolean;
};

type UIActions = {
  setActivePage: (page: Page) => void;
  closeActivePage: () => void;
  setPagePosition: (position: PagePosition) => void;
  toggleDebugInventoryInfo: () => void;
};
export const useUIStore = create<UIState & UIActions>((set) => ({
  // State
  activePage: null,
  pagePosition: PagePosition.RIGHT,
  debugInventoryInfo: false,

  // Actions
  setActivePage: (page) => {
    set({ activePage: page });
  },
  closeActivePage: () => {
    set({ activePage: null });
  },
  setPagePosition: (position: PagePosition) => {
    set({ pagePosition: position });
  },
  toggleDebugInventoryInfo: () => {
    set((state) => ({ debugInventoryInfo: !state.debugInventoryInfo }));
  },
}));
