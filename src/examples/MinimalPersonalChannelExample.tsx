/**
 * Quick Start Example - Personal Player Channel
 *
 * This file shows a minimal working example of the personal channel system.
 * Copy this pattern to integrate into your existing components.
 */

import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";

export function MinimalPersonalChannelExample() {
  // 1. Get socket from your existing socket store
  const { socket, isConnected } = useSocketStore();

  // 2. Get personal channel state
  const { displayedState, isReady, lastError } = usePersonalChannelStore();

  // 3. Get action functions
  const { equipItem, unequipItem } = usePersonalChannelActions(socket);

  // 4. Show loading state
  if (!isConnected) {
    return <div>Connecting...</div>;
  }

  if (!isReady || !displayedState) {
    return <div>Loading player data...</div>;
  }

  // 5. Use the state!
  return (
    <div>
      {/* Show error if any */}
      {lastError && <div className="error">{lastError}</div>}

      {/* Display player stats */}
      <div>
        <h2>Level {displayedState.stats.level}</h2>
        <p>
          HP: {displayedState.stats.hp}/{displayedState.stats.maxHp}
        </p>
        <p>Gold: {displayedState.currency.gold}</p>
      </div>

      {/* Display inventory */}
      <div>
        <h3>Inventory</h3>
        {displayedState.inventory.items.map((item) => (
          <div key={item.slotNumber}>
            <span>
              {item.name} x{item.quantity}
            </span>
            <button onClick={() => equipItem(item.slotNumber!)}>Equip</button>
          </div>
        ))}
      </div>

      {/* Display equipment */}
      <div>
        <h3>Equipment</h3>
        {Object.entries(displayedState.equipment).map(([slot, item]) => (
          <div key={slot}>
            <span>
              {slot}: {item.name}
            </span>
            <button onClick={() => unequipItem(slot)}>Unequip</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Integration Steps:
 *
 * 1. The SocketProvider already initializes the personal channel automatically
 * 2. Just use the hooks in any component:
 *    - usePersonalChannelStore() for reading state
 *    - usePersonalChannelActions(socket) for actions
 *
 * 3. That's it! The system handles:
 *    - Connection management
 *    - State synchronization
 *    - Optimistic updates
 *    - Rollback on errors
 *    - Reconnection
 */

/**
 * Available Actions:
 *
 * const actions = usePersonalChannelActions(socket);
 *
 * actions.equipItem(slotNumber, targetLocation?)
 * actions.unequipItem(slotName)
 * actions.swapInventorySlots(slot1, slot2)
 * actions.equipAbility(slotIndex, abilityId)
 * actions.requestSync() // Manual sync if needed
 */

/**
 * Available State:
 *
 * const state = usePersonalChannelStore();
 *
 * state.displayedState          // Current state (includes optimistic updates)
 * state.confirmedState          // Last confirmed state (for rollback)
 * state.isReady                 // Is the channel ready?
 * state.isSubscribed            // Are we subscribed?
 * state.lastError               // Last error message
 * state.pendingActions          // Map of pending actions
 * state.versions                // Version numbers for each domain
 */

export default MinimalPersonalChannelExample;
