import { create } from "zustand";
import { InteractionData, NpcPopupType } from "../types/npcInteraction";

interface NpcStore {
  activeNpcId: string | null;
  activePopupType: NpcPopupType | null;
  popupData: InteractionData | null;
  isLoading: boolean;
  error: string | null;
  toast: { message: string; key: number } | null;

  openPopup: (
    npcId: string,
    type: NpcPopupType,
    data: InteractionData
  ) => void;
  updatePopupData: (data: InteractionData) => void;
  closePopup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToast: (message: string | null) => void;
}

export const useNpcStore = create<NpcStore>((set) => ({
  activeNpcId: null,
  activePopupType: null,
  popupData: null,
  isLoading: false,
  error: null,
  toast: null,

  openPopup: (npcId, type, data) =>
    set({
      activeNpcId: npcId,
      activePopupType: type,
      popupData: data,
      isLoading: false,
      error: null,
    }),

  updatePopupData: (data) =>
    set({
      activePopupType: data.type as NpcPopupType,
      popupData: data,
      isLoading: false,
      error: null,
    }),

  closePopup: () =>
    set({
      activeNpcId: null,
      activePopupType: null,
      popupData: null,
      isLoading: false,
      error: null,
      toast: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setToast: (message) =>
    set(message !== null ? { toast: { message, key: Date.now() } } : { toast: null }),
}));
