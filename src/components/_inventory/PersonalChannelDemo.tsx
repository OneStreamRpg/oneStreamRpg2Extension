// Example usage component showing all personal channel features
import { useSocketStore } from "../../store/socketStore";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";

const PersonalChannelDemo = () => {
  const { socket, isConnected } = useSocketStore();
  const { 
    isSubscribed, 
    isReady, 
    displayedState,
    pendingActions,
    lastError 
  } = usePersonalChannelStore();
  
  const { 
    equipItem, 
    unequipItem, 
    swapInventorySlots, 
    equipAbility,
    requestSync 
  } = usePersonalChannelActions(socket);

  // Early returns for loading states
  if (!isConnected) {
    return (
      <div className="p-4">
        <div className="text-yellow-400 text-sm">Connecting to server...</div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="p-4">
        <div className="text-blue-400 text-sm">Subscribing to personal channel...</div>
      </div>
    );
  }

  if (!isReady || !displayedState) {
    return (
      <div className="p-4">
        <div className="text-gray-400 text-sm">Loading player state...</div>
        <div className="text-xs text-gray-500 mt-2">
          Ready: {isReady ? "Yes" : "No"}<br />
          State: {displayedState ? "Loaded" : "Not loaded"}
        </div>
      </div>
    );
  }

  // TypeScript guard - this should never happen due to check above
  if (!displayedState) {
    return <div className="p-4 text-red-400">Error: No state available</div>;
  }

  const pendingCount = pendingActions.size;

  return (
    <div className="p-4 space-y-4">
      {/* Connection Status */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-green-400 mb-2">✅ Connected</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Subscribed: {isSubscribed ? "Yes" : "No"}</p>
          <p>Ready: {isReady ? "Yes" : "No"}</p>
          <p>Pending Actions: {pendingCount}</p>
        </div>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3">
          <p className="text-sm text-red-300">{lastError}</p>
        </div>
      )}

      {/* State Versions */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-blue-400 mb-2">State Versions</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Inventory: v{displayedState.versions.inventory}</p>
          <p>Equipment: v{displayedState.versions.equipment}</p>
          <p>Currency: v{displayedState.versions.currency}</p>
          <p>Abilities: v{displayedState.versions.abilities}</p>
          <p>Stats: v{displayedState.versions.stats}</p>
        </div>
      </div>

      {/* Player Stats */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-purple-400 mb-2">Player Stats</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Level: {displayedState.stats.level}</p>
          <p>HP: {displayedState.stats.hp}/{displayedState.stats.maxHp}</p>
          <p>Mana: {displayedState.stats.mana}/{displayedState.stats.maxMana}</p>
          <p>XP: {displayedState.stats.xp}/{displayedState.stats.xpToNextLevel}</p>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-yellow-400 mb-2">Currency</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Gold: {displayedState.currency.gold}</p>
          {displayedState.currency.gems !== undefined && (
            <p>Gems: {displayedState.currency.gems}</p>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-green-400 mb-2">
          Inventory ({displayedState.inventory.items.length}/{displayedState.inventory.maxSize})
        </h3>
        <div className="space-y-1">
          {displayedState.inventory.items.map((item, index) => (
            <div 
              key={index}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => equipItem(index)}
            >
              <span>
                Slot {index}: {item.name}
              </span>
              <span className="text-gray-500">x{item.quantity}</span>
            </div>
          ))}
          {displayedState.inventory.items.length === 0 && (
            <p className="text-xs text-gray-500">Empty inventory</p>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-orange-400 mb-2">Equipment</h3>
        <div className="space-y-1">
          {Object.entries(displayedState.equipment).map(([slot, item]) => (
            <div 
              key={slot}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => unequipItem(slot)}
            >
              <span className="capitalize">{slot}:</span>
              <span>{item.name}</span>
            </div>
          ))}
          {Object.keys(displayedState.equipment).length === 0 && (
            <p className="text-xs text-gray-500">No equipment</p>
          )}
        </div>
      </div>

      {/* Abilities */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-cyan-400 mb-2">Abilities Hotbar</h3>
        <div className="space-y-1">
          {displayedState.abilities.hotbar.map((slot) => (
            <div key={slot.slot} className="flex justify-between text-xs text-gray-300">
              <span>Slot {slot.slot + 1}:</span>
              <span>{slot.name || slot.abilityId || "Empty"}</span>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-bold text-cyan-400 mt-3 mb-2">Learned Abilities</h3>
        <div className="space-y-1">
          {displayedState.abilities.learned.map((ability) => (
            <div 
              key={ability.abilityId}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => equipAbility(0, ability.abilityId)}
            >
              <span>{ability.name}</span>
              <span className="text-gray-500">Lv {ability.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-800 rounded p-3 space-y-2">
        <h3 className="text-sm font-bold text-white mb-2">Actions</h3>
        
        <button
          onClick={requestSync}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded"
        >
          🔄 Request Full Sync
        </button>

        {displayedState.inventory.items.length >= 2 && (
          <button
            onClick={() => {
              // System uses array indices as slot numbers
              swapInventorySlots(0, 1);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded"
          >
            🔀 Swap First Two Items
          </button>
        )}

        {displayedState.inventory.items.length > 0 && (
          <button
            onClick={() => {
              // System uses array index 0 for first item
              equipItem(0);
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded"
          >
            ⚔️ Equip First Item
          </button>
        )}

        {Object.keys(displayedState.equipment).length > 0 && (
          <button
            onClick={() => {
              const firstSlot = Object.keys(displayedState.equipment)[0];
              unequipItem(firstSlot);
            }}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-2 px-3 rounded"
          >
            📤 Unequip First Item
          </button>
        )}
      </div>

      {/* Pending Actions Display */}
      {pendingCount > 0 && (
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded p-3">
          <h3 className="text-sm font-bold text-yellow-300 mb-2">
            ⏳ Pending Actions ({pendingCount})
          </h3>
          <div className="space-y-1">
            {Array.from(pendingActions.values()).map((pending) => (
              <div key={pending.action.actionId} className="text-xs text-yellow-200">
                {pending.action.type} (seq: {pending.action.seq})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalChannelDemo;
