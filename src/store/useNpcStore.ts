import { create } from "zustand";
import { InteractionData, NpcPopupType } from "../types/npcInteraction";

interface NpcStore {
  activeNpcId: string | null;
  activePopupType: NpcPopupType | null;
  popupData: InteractionData | null;
  isLoading: boolean;
  error: string | null;

  openPopup: (
    npcId: string,
    type: NpcPopupType,
    data: InteractionData
  ) => void;
  updatePopupData: (data: InteractionData) => void;
  closePopup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNpcStore = create<NpcStore>((set) => ({
  activeNpcId: null,
  activePopupType: null,
  popupData: null,
  isLoading: false,
  error: null,

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
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
