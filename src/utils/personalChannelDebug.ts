/**
 * Personal Channel Testing Utilities
 * 
 * Use these functions to test and debug the personal channel implementation
 */

import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";

/**
 * Log current state to console
 */
export function logPersonalChannelState() {
  const state = usePersonalChannelStore.getState();
  const socketState = useSocketStore.getState();

  console.group("🔍 Personal Channel State");
  console.log("Socket Connected:", socketState.isConnected);
  console.log("Subscribed:", state.isSubscribed);
  console.log("Ready:", state.isReady);
  console.log("Pending Actions:", state.pendingActions.size);
  console.log("Last Error:", state.lastError);
  console.log("Versions:", state.versions);
  console.log("Displayed State:", state.displayedState);
  console.log("Confirmed State:", state.confirmedState);
  console.groupEnd();
}

/**
 * Verify implementation checklist
 */
export function verifyImplementation() {
  const state = usePersonalChannelStore.getState();
  const socketState = useSocketStore.getState();

  const checks = {
    "Socket exists": socketState.socket !== null,
    "Socket connected": socketState.isConnected,
    "Channel subscribed": state.isSubscribed,
    "State initialized": state.displayedState !== null,
    "Versions tracked": state.versions !== null,
    "Ready for actions": state.isReady,
    "No errors": state.lastError === null,
  };

  console.group("✅ Implementation Verification");
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(passed ? "✅" : "❌", check);
  });
  console.groupEnd();

  return Object.values(checks).every((v) => v);
}

/**
 * Get detailed action statistics
 */
export function getActionStats() {
  const state = usePersonalChannelStore.getState();
  const pendingActions = Array.from(state.pendingActions.values());

  const stats = {
    total: pendingActions.length,
    byType: {} as Record<string, number>,
    oldestTimestamp: pendingActions.length > 0 
      ? Math.min(...pendingActions.map((a) => a.timestamp))
      : null,
    newestTimestamp: pendingActions.length > 0
      ? Math.max(...pendingActions.map((a) => a.timestamp))
      : null,
  };

  pendingActions.forEach((pending) => {
    const type = pending.action.type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  console.group("📊 Action Statistics");
  console.log("Total Pending:", stats.total);
  console.log("By Type:", stats.byType);
  if (stats.oldestTimestamp) {
    console.log("Oldest Pending:", Date.now() - stats.oldestTimestamp, "ms ago");
  }
  if (stats.newestTimestamp) {
    console.log("Newest Pending:", Date.now() - stats.newestTimestamp, "ms ago");
  }
  console.groupEnd();

  return stats;
}

/**
 * Monitor state changes
 */
export function monitorStateChanges(duration = 10000) {
  const unsubscribe = usePersonalChannelStore.subscribe(
    (state, prevState) => {
      console.group("🔄 State Changed");
      
      if (state.displayedState !== prevState.displayedState) {
        console.log("Displayed State Changed");
      }
      
      if (state.confirmedState !== prevState.confirmedState) {
        console.log("Confirmed State Changed");
      }
      
      if (state.versions !== prevState.versions) {
        console.log("Versions Changed:", state.versions);
      }
      
      if (state.pendingActions !== prevState.pendingActions) {
        console.log("Pending Actions:", state.pendingActions.size);
      }
      
      if (state.lastError !== prevState.lastError) {
        console.log("Error:", state.lastError);
      }
      
      console.groupEnd();
    }
  );

  console.log(`🔍 Monitoring state changes for ${duration}ms...`);
  
  setTimeout(() => {
    unsubscribe();
    console.log("✅ Monitoring stopped");
  }, duration);

  return unsubscribe;
}

/**
 * Test optimistic update and rollback
 */
export function testOptimisticUpdate() {
  const state = usePersonalChannelStore.getState();
  
  if (!state.isReady || !state.displayedState) {
    console.error("❌ Cannot test: Not ready");
    return;
  }

  const testAction = {
    actionId: "test-" + Date.now(),
    seq: state.actionSequence,
    type: "test",
    params: {},
  };

  console.log("🧪 Testing optimistic update...");
  
  // Apply optimistic update
  const testState = { ...state.displayedState };
  state.applyOptimisticUpdate(testAction, testState);
  
  console.log("✅ Optimistic update applied");
  console.log("Pending actions:", state.pendingActions.size);
  
  // Simulate rollback after 2 seconds
  setTimeout(() => {
    console.log("🔄 Testing rollback...");
    state.rollbackAction(testAction.actionId, "Test rollback");
    console.log("✅ Rollback completed");
    console.log("Pending actions:", state.pendingActions.size);
  }, 2000);
}

/**
 * Compare displayed vs confirmed state
 */
export function compareStates() {
  const state = usePersonalChannelStore.getState();
  
  if (!state.displayedState || !state.confirmedState) {
    console.error("❌ Cannot compare: States not initialized");
    return;
  }

  console.group("🔀 State Comparison");
  
  // Compare versions
  const versionsDiff = JSON.stringify(state.displayedState.versions) !== 
                       JSON.stringify(state.confirmedState.versions);
  console.log("Versions match:", !versionsDiff);
  
  // Compare inventory
  const inventoryDiff = JSON.stringify(state.displayedState.inventory) !== 
                        JSON.stringify(state.confirmedState.inventory);
  console.log("Inventory match:", !inventoryDiff);
  
  // Compare equipment
  const equipmentDiff = JSON.stringify(state.displayedState.equipment) !== 
                        JSON.stringify(state.confirmedState.equipment);
  console.log("Equipment match:", !equipmentDiff);
  
  // Compare currency
  const currencyDiff = JSON.stringify(state.displayedState.currency) !== 
                       JSON.stringify(state.confirmedState.currency);
  console.log("Currency match:", !currencyDiff);
  
  // Compare stats
  const statsDiff = JSON.stringify(state.displayedState.stats) !== 
                    JSON.stringify(state.confirmedState.stats);
  console.log("Stats match:", !statsDiff);
  
  const hasDifferences = versionsDiff || inventoryDiff || equipmentDiff || 
                         currencyDiff || statsDiff;
  
  if (hasDifferences) {
    console.warn("⚠️ States differ - optimistic updates pending");
    console.log("Pending actions:", state.pendingActions.size);
  } else {
    console.log("✅ States match - no optimistic updates");
  }
  
  console.groupEnd();
}

/**
 * Export all utilities to window for easy console access
 */
if (typeof window !== "undefined") {
  (window as any).personalChannelDebug = {
    logState: logPersonalChannelState,
    verify: verifyImplementation,
    stats: getActionStats,
    monitor: monitorStateChanges,
    test: testOptimisticUpdate,
    compare: compareStates,
  };
  
  console.log("🔧 Personal Channel Debug tools available:");
  console.log("  personalChannelDebug.logState()");
  console.log("  personalChannelDebug.verify()");
  console.log("  personalChannelDebug.stats()");
  console.log("  personalChannelDebug.monitor()");
  console.log("  personalChannelDebug.test()");
  console.log("  personalChannelDebug.compare()");
}
