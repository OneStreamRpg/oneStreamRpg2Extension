import { useEffect, useRef } from "react";
import { MATERIAL_CATEGORIES } from "../components/inventory/types";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useMaterialAlertStore } from "../store/useMaterialAlertStore";
import { MaterialMap } from "../types/personalChannel";

/**
 * Raises an on-screen alert the moment a material fills up.
 *
 * Lives outside the inventory on purpose: the cap is easiest to miss precisely
 * when the inventory isn't open, which is most of the time while gathering.
 */
export const useMaterialCapWatcher = () => {
  const counts = usePersonalChannelStore(
    (state) => state.displayedState?.inventory.materialCounts
  );
  const caps = usePersonalChannelStore(
    (state) => state.displayedState?.inventory.materialCaps
  );
  const previousCounts = useRef<MaterialMap | null>(null);

  useEffect(() => {
    if (!counts || !caps) {
      // Left the world — drop the baseline so coming back already capped isn't
      // read as a fresh crossing.
      previousCounts.current = null;
      return;
    }

    const previous = previousCounts.current;
    previousCounts.current = { ...counts };
    // Nothing to compare against on the first snapshot: only announce the
    // moment a material crosses into its cap, never that it already sits there.
    if (!previous) return;

    for (const category of MATERIAL_CATEGORIES) {
      const cap = caps[category] ?? 0;
      if (cap <= 0) continue;
      const wasBelow = (previous[category] ?? 0) < cap;
      const nowAtCap = (counts[category] ?? 0) >= cap;
      if (wasBelow && nowAtCap) {
        useMaterialAlertStore.getState().raise(category);
      }
    }
  }, [counts, caps]);
};
