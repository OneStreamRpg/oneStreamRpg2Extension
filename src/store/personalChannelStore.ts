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
      const result = computeDelta(delta, displayedState, versions);
      if (!result) return;
      logger.debug(TAG, "Delta applied to state", { delta });
      set({
        displayedState: result.newState,
        confirmedState: structuredClone(result.newState),
        versions: result.newVersions,
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

    // Confirm action success — always a single set() call to avoid cascading updates
    confirmAction: (actionId, delta) => {
      const { pendingActions, displayedState, versions } = get();

      const newPendingActions = new Map(pendingActions);
      newPendingActions.delete(actionId);

      logger.debug(TAG, `Action confirmed: actionId=${actionId}`);

      if (delta && displayedState && versions) {
        const result = computeDelta(delta, displayedState, versions);
        if (result) {
          set({
            displayedState: result.newState,
            confirmedState: structuredClone(result.newState),
            versions: result.newVersions,
            pendingActions: newPendingActions,
          });
          return;
        }
      }

      set({
        confirmedState: displayedState ? structuredClone(displayedState) : null,
        pendingActions: newPendingActions,
      });
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

// Pure helper — computes new state from a delta without calling set().
// Returns null if the delta is stale and should be rejected.
function computeDelta(
  delta: PlayerStateDelta,
  displayedState: PlayerPersonalState,
  versions: StateVersions
): { newState: PlayerPersonalState; newVersions: StateVersions } | null {
  // Stale version check
  if (delta.versions) {
    for (const [domain, version] of Object.entries(delta.versions)) {
      if (
        version !== undefined &&
        versions[domain as keyof StateVersions] !== undefined &&
        version < versions[domain as keyof StateVersions]
      ) {
        logger.warn(TAG, `Rejecting stale delta for domain: ${domain}`);
        return null;
      }
    }
  }

  const newState: PlayerPersonalState = { ...displayedState };
  const newVersions: StateVersions = { ...versions };

  if (delta.inventory !== undefined) {
    newState.inventory = delta.inventory;
    if (delta.versions?.inventory !== undefined) newVersions.inventory = delta.versions.inventory;
  }
  if (delta.equipment !== undefined) {
    newState.equipment = delta.equipment;
    if (delta.versions?.equipment !== undefined) newVersions.equipment = delta.versions.equipment;
  }
  if (delta.currency !== undefined) {
    newState.currency = delta.currency;
    if (delta.versions?.currency !== undefined) newVersions.currency = delta.versions.currency;
  }
  if (delta.abilities !== undefined) {
    newState.abilities = delta.abilities;
    if (delta.versions?.abilities !== undefined) newVersions.abilities = delta.versions.abilities;
  }
  if (delta.stats !== undefined) {
    newState.stats = delta.stats;
    if (delta.versions?.stats !== undefined) newVersions.stats = delta.versions.stats;
  }
  if (delta.quests !== undefined) {
    newState.quests = delta.quests;
    if (delta.versions?.questsVersion !== undefined) newVersions.questsVersion = delta.versions.questsVersion;
  }
  if (delta.craftRecipes !== undefined) {
    newState.craftRecipes = delta.craftRecipes;
    if (delta.versions?.craftRecipesVersion !== undefined) newVersions.craftRecipesVersion = delta.versions.craftRecipesVersion;
  }
  if (delta.profile !== undefined) newState.profile = delta.profile;
  if (delta.classTreeChoices !== undefined) newState.classTreeChoices = delta.classTreeChoices;
  if (delta.pendingClassTreeChoice !== undefined) newState.pendingClassTreeChoice = delta.pendingClassTreeChoice;
  if (delta.group !== undefined) newState.group = delta.group;
  if (delta.pendingGroupInvites !== undefined) newState.pendingGroupInvites = delta.pendingGroupInvites;
  if (delta.outgoingGroupInvites !== undefined) newState.outgoingGroupInvites = delta.outgoingGroupInvites;

  return { newState, newVersions };
}

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
