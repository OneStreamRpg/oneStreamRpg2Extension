import { create } from "zustand";
import {
  PlayerPersonalState,
  PlayerStateDelta,
  PendingAction,
  PersonalChannelAction,
  StateVersions,
} from "../types/personalChannel";

interface PersonalChannelStore {
  // Connection state
  isSubscribed: boolean;
  isReady: boolean;

  // State management
  confirmedState: PlayerPersonalState | null;
  displayedState: PlayerPersonalState | null;
  versions: StateVersions | null;

  // Pending actions
  pendingActions: Map<string, PendingAction>;
  actionSequence: number;

  // Error state
  lastError: string | null;

  // Actions
  setSubscribed: (subscribed: boolean) => void;
  setReady: (ready: boolean) => void;
  setInitialState: (state: PlayerPersonalState) => void;
  applyDelta: (delta: PlayerStateDelta) => void;
  applyOptimisticUpdate: (action: PersonalChannelAction, newState: PlayerPersonalState) => void;
  confirmAction: (actionId: string, delta?: PlayerStateDelta) => void;
  rollbackAction: (actionId: string, error?: string) => void;
  rollbackAllActions: () => void;
  getNextSequence: () => number;
  clearPendingAction: (actionId: string) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export const usePersonalChannelStore = create<PersonalChannelStore>((set, get) => ({
  // Initial state
  isSubscribed: false,
  isReady: false,
  confirmedState: null,
  displayedState: null,
  versions: null,
  pendingActions: new Map(),
  actionSequence: 0,
  lastError: null,

  // Set subscription status
  setSubscribed: (subscribed) => set({ isSubscribed: subscribed }),

  // Set ready status
  setReady: (ready) => set({ isReady: ready }),

  // Initialize state from server
  setInitialState: (state) => {
    console.log("🎯 Personal Channel: Initial state received", state);
    set({
      confirmedState: state,
      displayedState: structuredClone(state),
      versions: state.versions,
      isReady: true,
      pendingActions: new Map(),
      actionSequence: 0,
    });
  },

  // Apply delta from server
  applyDelta: (delta) => {
    const { versions, displayedState } = get();

    if (!displayedState || !versions) {
      console.warn("⚠️ Cannot apply delta: No state initialized");
      return;
    }

    // Check version numbers - reject stale updates
    let isStale = false;
    if (delta.versions) {
      Object.entries(delta.versions).forEach(([domain, version]) => {
        if (version !== undefined && versions[domain as keyof StateVersions] !== undefined) {
          if (version < versions[domain as keyof StateVersions]) {
            console.warn(`⚠️ Rejecting stale delta for domain: ${domain}`, {
              received: version,
              current: versions[domain as keyof StateVersions],
            });
            isStale = true;
          }
        }
      });
    }

    if (isStale) return;

    // Apply delta domains
    const newState = { ...displayedState };
    const newVersions = { ...versions };

    if (delta.inventory !== undefined) {
      newState.inventory = delta.inventory;
      if (delta.versions?.inventory !== undefined) {
        newVersions.inventory = delta.versions.inventory;
      }
    }

    if (delta.equipment !== undefined) {
      newState.equipment = delta.equipment;
      if (delta.versions?.equipment !== undefined) {
        newVersions.equipment = delta.versions.equipment;
      }
    }

    if (delta.currency !== undefined) {
      newState.currency = delta.currency;
      if (delta.versions?.currency !== undefined) {
        newVersions.currency = delta.versions.currency;
      }
    }

    if (delta.abilities !== undefined) {
      newState.abilities = delta.abilities;
      if (delta.versions?.abilities !== undefined) {
        newVersions.abilities = delta.versions.abilities;
      }
    }

    if (delta.stats !== undefined) {
      newState.stats = delta.stats;
      if (delta.versions?.stats !== undefined) {
        newVersions.stats = delta.versions.stats;
      }
    }

    console.log("📦 Personal Channel: Delta applied", delta);
    set({
      displayedState: newState,
      confirmedState: structuredClone(newState),
      versions: newVersions,
    });
  },

  // Apply optimistic update
  applyOptimisticUpdate: (action, newState) => {
    const { confirmedState, pendingActions } = get();

    if (!confirmedState) {
      console.warn("⚠️ Cannot apply optimistic update: No confirmed state");
      return;
    }

    // Store pending action with snapshot
    const pendingAction: PendingAction = {
      action,
      timestamp: Date.now(),
      beforeState: structuredClone(confirmedState),
    };

    const newPendingActions = new Map(pendingActions);
    newPendingActions.set(action.actionId, pendingAction);

    console.log("⚡ Optimistic update applied", {
      actionId: action.actionId,
      type: action.type,
    });

    set({
      displayedState: newState,
      pendingActions: newPendingActions,
    });
  },

  // Confirm action success
  confirmAction: (actionId, delta) => {
    const { pendingActions, displayedState } = get();

    const newPendingActions = new Map(pendingActions);
    newPendingActions.delete(actionId);

    console.log("✅ Action confirmed", { actionId });

    // If server provided delta, apply it (authoritative)
    if (delta && displayedState) {
      get().applyDelta(delta);
      // Update pending actions after applying delta
      set({ pendingActions: newPendingActions });
    } else {
      // Otherwise, just update confirmed state to match displayed
      set({
        confirmedState: displayedState ? structuredClone(displayedState) : null,
        pendingActions: newPendingActions,
      });
    }
  },

  // Rollback action on failure
  rollbackAction: (actionId, error) => {
    const { pendingActions, confirmedState } = get();

    const pendingAction = pendingActions.get(actionId);
    if (!pendingAction) {
      console.warn("⚠️ Cannot rollback: Action not found", actionId);
      return;
    }

    console.error("❌ Action failed - Rolling back", {
      actionId,
      error,
      type: pendingAction.action.type,
    });

    const newPendingActions = new Map(pendingActions);
    newPendingActions.delete(actionId);

    // Restore to last confirmed state
    let restoredState = confirmedState ? structuredClone(confirmedState) : null;

    // Reapply remaining pending actions in sequence order
    if (restoredState) {
      const remainingActions = Array.from(newPendingActions.values())
        .sort((a, b) => a.action.seq - b.action.seq);

      for (const pending of remainingActions) {
        // Reapply the action logic
        restoredState = applyActionToState(pending.action, restoredState);
      }
    }

    set({
      displayedState: restoredState,
      pendingActions: newPendingActions,
      lastError: error || "Action failed",
    });
  },

  // Rollback all pending actions
  rollbackAllActions: () => {
    const { confirmedState } = get();
    console.warn("⚠️ Rolling back all pending actions");
    set({
      displayedState: confirmedState ? structuredClone(confirmedState) : null,
      pendingActions: new Map(),
    });
  },

  // Get next sequence number
  getNextSequence: () => {
    const seq = get().actionSequence;
    set({ actionSequence: seq + 1 });
    return seq;
  },

  // Clear a pending action
  clearPendingAction: (actionId) => {
    const { pendingActions } = get();
    const newPendingActions = new Map(pendingActions);
    newPendingActions.delete(actionId);
    set({ pendingActions: newPendingActions });
  },

  // Set error message
  setError: (error) => set({ lastError: error }),

  // Reset all state
  resetState: () => {
    console.log("🔄 Resetting personal channel state");
    set({
      isSubscribed: false,
      isReady: false,
      confirmedState: null,
      displayedState: null,
      versions: null,
      pendingActions: new Map(),
      actionSequence: 0,
      lastError: null,
    });
  },
}));

// Helper function to reapply action logic
function applyActionToState(
  action: PersonalChannelAction,
  state: PlayerPersonalState
): PlayerPersonalState {
  const newState = structuredClone(state);

  try {
    switch (action.type) {
      case "equipItem": {
        const { slotNumber, targetLocation } = action.params;
        const item = newState.inventory.items.find(
          (i) => i.slotNumber === slotNumber
        );
        if (item) {
          // Move to equipment
          const slot = targetLocation || item.type;
          if (slot in newState.equipment) {
            newState.equipment[slot as keyof typeof newState.equipment] = {
              itemId: item.itemId,
              name: item.name,
              type: item.type,
              metadata: item.metadata,
            };
          }
          // Remove from inventory
          newState.inventory.items = newState.inventory.items.filter(
            (i) => i.slotNumber !== slotNumber
          );
        }
        break;
      }

      case "unequipItem": {
        const { slotName } = action.params;
        const equipped = newState.equipment[slotName as keyof typeof newState.equipment];
        if (equipped) {
          // Add to inventory
          const nextSlot = Math.max(
            0,
            ...newState.inventory.items.map((i) => i.slotNumber)
          ) + 1;
          newState.inventory.items.push({
            slotNumber: nextSlot,
            itemId: equipped.itemId,
            name: equipped.name,
            type: equipped.type,
            quantity: 1,
            metadata: equipped.metadata,
          });
          // Remove from equipment
          delete newState.equipment[slotName as keyof typeof newState.equipment];
        }
        break;
      }

      case "swapInventorySlots": {
        const { slot1, slot2 } = action.params;
        const item1 = newState.inventory.items.find((i) => i.slotNumber === slot1);
        const item2 = newState.inventory.items.find((i) => i.slotNumber === slot2);

        if (item1) item1.slotNumber = slot2;
        if (item2) item2.slotNumber = slot1;
        break;
      }

      case "equipAbility": {
        const { slotIndex, abilityId } = action.params;
        const hotbarSlot = newState.abilities.hotbar.find((h) => h.slot === slotIndex);
        if (hotbarSlot) {
          hotbarSlot.abilityId = abilityId;
          const learned = newState.abilities.learned.find((l) => l.abilityId === abilityId);
          if (learned) {
            hotbarSlot.name = learned.name;
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Error reapplying action", { action, error });
  }

  return newState;
}
