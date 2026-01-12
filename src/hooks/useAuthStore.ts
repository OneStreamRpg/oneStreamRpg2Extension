import { create } from 'zustand';
import { TwitchUser } from '../services/TwitchService';

type AuthState = {
    token: string | null;
    channelId: string | null;
    isAuthenticated: boolean | null;
    profile: TwitchUser | null;
    setAuth: (authData: { token: string; channelId: string; isLinked: boolean }) => void;
    setProfile: (profile: TwitchUser) => void;
    setLoggedOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    channelId: null,
    isAuthenticated: null,
    profile: null,

    setAuth: (authData) => {
        set({
            token: authData.token,
            channelId: authData.channelId,
            isAuthenticated: authData.isLinked,
        });
    },

    setProfile: (profile) => {
        set({ profile });
    },

    setLoggedOut: () => {
        set({ isAuthenticated: false });
    },
}));
