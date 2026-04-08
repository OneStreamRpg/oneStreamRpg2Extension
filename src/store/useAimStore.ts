import { create } from "zustand";
import { AbilitySlotType } from "../services/MetadataService";

interface AimStore {
  isAiming: boolean;
  slotType: AbilitySlotType | null;
  abilityType: "skillshot" | "aoeCircle" | null;
  range: number | null;
  effectSize: number | null;
  startAim: (
    slotType: AbilitySlotType,
    abilityType: "skillshot" | "aoeCircle",
    range: number | null,
    effectSize: number | null
  ) => void;
  stopAim: () => void;
}

export const useAimStore = create<AimStore>((set) => ({
  isAiming: false,
  slotType: null,
  abilityType: null,
  range: null,
  effectSize: null,
  startAim: (slotType, abilityType, range, effectSize) =>
    set({ isAiming: true, slotType, abilityType, range, effectSize }),
  stopAim: () =>
    set({ isAiming: false, slotType: null, abilityType: null, range: null, effectSize: null }),
}));
