import { create } from "zustand";
import { InteractionData, NpcPopupType } from "../types/npcInteraction";

interface NpcStore {
  activeNpcId: string | null;
  activePopupType: NpcPopupType | null;
  popupData: InteractionData | null;
  isLoading: boolean;

  openPopup: (
    npcId: string,
    type: NpcPopupType,
    data: InteractionData
  ) => void;
  updatePopupData: (data: InteractionData) => void;
  closePopup: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNpcStore = create<NpcStore>((set) => ({
  activeNpcId: null,
  activePopupType: null,
  popupData: null,
  isLoading: false,

  openPopup: (npcId, type, data) =>
    set({
      activeNpcId: npcId,
      activePopupType: type,
      popupData: data,
      isLoading: false,
    }),

  updatePopupData: (data) =>
    set({
      activePopupType: data.type as NpcPopupType,
      popupData: data,
      isLoading: false,
    }),

  closePopup: () =>
    set({
      activeNpcId: null,
      activePopupType: null,
      popupData: null,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
