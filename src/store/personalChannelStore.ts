import { create } from "zustand";
import { logger } from "../services/Logger";
import {
  PendingAction,
  PersonalChannelAction,
  PlayerPersonalState,
  PlayerStateDelta,
  StateVersions,
} from "../types/personalChannel";

const TAG = "PersonalChannelStore";

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
  applyOptimisticUpdate: (
    action: PersonalChannelAction,
    newState: PlayerPersonalState
  ) => void;
  confirmAction: (actionId: string, delta?: PlayerStateDelta) => void;
  rollbackAction: (actionId: string, error?: string) => void;
  rollbackAllActions: () => void;
  getNextSequence: () => number;
  clearPendingAction: (actionId: string) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export const usePersonalChannelStore = create<PersonalChannelStore>(
  (set, get) => ({
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
      logger.info(TAG, "Initial state set", { state });
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
        logger.warn(TAG, "Cannot apply delta: state not initialized");
        return;
      }

      // Check version numbers - reject stale updates
      let isStale = false;
      if (delta.versions) {
        Object.entries(delta.versions).forEach(([domain, version]) => {
          if (
            version !== undefined &&
            versions[domain as keyof StateVersions] !== undefined
          ) {
            if (version < versions[domain as keyof StateVersions]) {
              logger.warn(TAG, `Rejecting stale delta for domain: ${domain}`, {
                receivedVersion: version,
                currentVersion: versions[domain as keyof StateVersions],
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

      logger.debug(TAG, "Delta applied to state", { delta });
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
        logger.warn(TAG, "Cannot apply optimistic update: no confirmed state");
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

      logger.debug(TAG, `Optimistic update applied: type=${action.type}, actionId=${action.actionId}`);

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

      logger.debug(TAG, `Action confirmed: actionId=${actionId}`);

      // If server provided delta, apply it (authoritative)
      if (delta && displayedState) {
        get().applyDelta(delta);
        // Update pending actions after applying delta
        set({ pendingActions: newPendingActions });
      } else {
        // Otherwise, just update confirmed state to match displayed
        set({
          confirmedState: displayedState
            ? structuredClone(displayedState)
            : null,
          pendingActions: newPendingActions,
        });
      }
    },

    // Rollback action on failure
    rollbackAction: (actionId, error) => {
      const { pendingActions, confirmedState } = get();

      const pendingAction = pendingActions.get(actionId);
      if (!pendingAction) {
        logger.warn(TAG, `Cannot rollback: action not found, actionId=${actionId}`);
        return;
      }

      logger.error(TAG, `Action failed, rolling back: type=${pendingAction.action.type}, actionId=${actionId}, error=${error}`);

      const newPendingActions = new Map(pendingActions);
      newPendingActions.delete(actionId);

      // Restore to last confirmed state
      let restoredState = confirmedState
        ? structuredClone(confirmedState)
        : null;

      // Reapply remaining pending actions in sequence order
      if (restoredState) {
        const remainingActions = Array.from(newPendingActions.values()).sort(
          (a, b) => a.action.seq - b.action.seq
        );

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
      logger.warn(TAG, "Rolling back all pending actions");
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
      logger.info(TAG, "Resetting personal channel state");
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
  })
);

// Helper function to reapply action logic
function applyActionToState(
  action: PersonalChannelAction,
  state: PlayerPersonalState
): PlayerPersonalState {
  const newState = structuredClone(state);
  logger.debug(TAG, `Reapplying action: type=${action.type}, actionId=${action.actionId}`);
  // TODO MC: Removed due to outdated code.
  return newState;
}
