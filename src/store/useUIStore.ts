import { create } from "zustand";
import { Page, PagePosition } from "../types/ui";

type UIState = {
  activePage: Page | null;
  pagePosition: PagePosition;
  debugInventoryInfo: boolean;
  questPanelOpen: boolean;
  profileOpen: boolean;
  groupPanelOpen: boolean;
  groupError: string | null;
};

type UIActions = {
  setActivePage: (page: Page) => void;
  closeActivePage: () => void;
  setPagePosition: (position: PagePosition) => void;
  toggleDebugInventoryInfo: () => void;
  toggleQuestPanel: () => void;
  toggleProfile: () => void;
  toggleGroupPanel: () => void;
  setGroupError: (error: string | null) => void;
};
export const useUIStore = create<UIState & UIActions>((set) => ({
  // State
  activePage: null,
  pagePosition: PagePosition.RIGHT,
  debugInventoryInfo: true,
  questPanelOpen: true,
  profileOpen: true,
  groupPanelOpen: false,
  groupError: null,

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
  toggleGroupPanel: () => {
    set((state) => ({ groupPanelOpen: !state.groupPanelOpen }));
  },
  setGroupError: (groupError) => set({ groupError }),
}));
