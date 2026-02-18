import { create } from "zustand";
import { Page, PagePosition } from "../types/ui";

type UIState = {
  activePage: Page | null;
  pagePosition: PagePosition;
  debugInventoryInfo: boolean;
  questPanelOpen: boolean;
  profileOpen: boolean;
};

type UIActions = {
  setActivePage: (page: Page) => void;
  closeActivePage: () => void;
  setPagePosition: (position: PagePosition) => void;
  toggleDebugInventoryInfo: () => void;
  toggleQuestPanel: () => void;
  toggleProfile: () => void;
};
export const useUIStore = create<UIState & UIActions>((set) => ({
  // State
  activePage: null,
  pagePosition: PagePosition.RIGHT,
  debugInventoryInfo: true,
  questPanelOpen: true,
  profileOpen: true,

  // Actions
  setActivePage: (page) => {
    set((state) => ({ activePage: state.activePage === page ? null : page }));
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
  toggleQuestPanel: () => {
    set((state) => ({ questPanelOpen: !state.questPanelOpen }));
  },
  toggleProfile: () => {
    set((state) => ({ profileOpen: !state.profileOpen }));
  },
}));
