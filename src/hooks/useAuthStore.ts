import { create } from 'zustand';

type AuthState = {
    token: string | null;
    channelId: string | null;
    isAuthenticated: boolean | null;
    setAuth: (authData: { token: string; channelId: string; isLinked: boolean }) => void;
    setLoggedOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    channelId: null,
    isAuthenticated: null,

    setAuth: (authData) => set({
        token: authData.token,
        channelId: authData.channelId,
        isAuthenticated: authData.isLinked,
    }),

    setLoggedOut: () => set({ isAuthenticated: false }),
}))