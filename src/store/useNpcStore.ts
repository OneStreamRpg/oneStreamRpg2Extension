import { create } from "zustand";
import { GambleData, InteractionData, NpcPopupType } from "../types/npcInteraction";

interface NpcStore {
  activeNpcId: string | null;
  activePopupType: NpcPopupType | null;
  popupData: InteractionData | null;
  isLoading: boolean;
  error: string | null;
  toast: { message: string; key: number; isError?: boolean } | null;
  // Latest resolved gamble flip — the NpcGamble menu watches this to drive its
  // win/lose animation. Cleared when the menu opens and when the popup closes.
  gambleResult: GambleData | null;

  openPopup: (
    npcId: string,
    type: NpcPopupType,
    data: InteractionData
  ) => void;
  updatePopupData: (data: InteractionData) => void;
  closePopup: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToast: (message: string | null, isError?: boolean) => void;
  setGambleResult: (result: GambleData | null) => void;
}

export const useNpcStore = create<NpcStore>((set) => ({
  activeNpcId: null,
  activePopupType: null,
  popupData: null,
  isLoading: false,
  error: null,
  toast: null,
  gambleResult: null,

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
      gambleResult: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setToast: (message, isError) =>
    set(message !== null ? { toast: { message, key: Date.now(), isError } } : { toast: null }),
  setGambleResult: (result) => set({ gambleResult: result }),
}));
