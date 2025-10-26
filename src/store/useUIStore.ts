import { create } from 'zustand';
import { Page } from '../types/ui';

type UIState = {
    activePage: Page | null;
}

type UIActions = {
    setActivePage: (page: Page) => void;
    closeActivePage: () => void;
}
export const useUIStore = create<UIState & UIActions>((set) => ({
    // State
    activePage: null,

    // Actions
    setActivePage: (page) => {
        set({ activePage: page });
    },
    closeActivePage: () => {
        set({ activePage: null });
    }
}));
