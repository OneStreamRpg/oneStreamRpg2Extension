import { create } from 'zustand';
import { Page, PagePosition } from '../types/ui';

type UIState = {
    activePage: Page | null;
    pagePosition: PagePosition;
}

type UIActions = {
    setActivePage: (page: Page) => void;
    closeActivePage: () => void;
}
export const useUIStore = create<UIState & UIActions>((set) => ({
    // State
    activePage: null,
    pagePosition: PagePosition.RIGHT,

    // Actions
    setActivePage: (page) => {
        set({ activePage: page });
    },
    closeActivePage: () => {
        set({ activePage: null });
    },
    setPagePosition: (position: PagePosition) => {
        set({ pagePosition: position });
    }
}));
