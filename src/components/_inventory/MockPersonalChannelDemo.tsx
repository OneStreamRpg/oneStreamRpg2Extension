// Mock Personal Channel Demo for Testing (when server is not ready)
import { useSocketStore } from "../../store/socketStore";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { PlayerPersonalState } from "../../types/personalChannel";

const MockPersonalChannelDemo = () => {
  const { socket, isConnected } = useSocketStore();
  const { isSubscribed, isReady, displayedState, pendingActions, lastError } = usePersonalChannelStore();
  const { equipItem, unequipItem, swapInventorySlots, equipAbility, requestSync } = usePersonalChannelActions(socket);

  // Mock data for testing UI without server
  const mockState: PlayerPersonalState = {
    versions: {
      inventory: 1,
      equipment: 1,
      currency: 1,
      abilities: 1,
      stats: 1,
    },
    inventory: {
      items: [
        { itemId: "sword_1", name: "Iron Sword", type: "mainHand", quantity: 1 },
        { itemId: "helm_1", name: "Iron Helmet", type: "helmet", quantity: 1 },
        { itemId: "potion_hp", name: "Health Potion", type: "consumable", quantity: 5 },
      ],
      maxSize: 36,
    },
    equipment: {
      chest: { itemId: "chest_1", name: "Iron Chestplate", type: "chest" },
      mainHand: { itemId: "sword_starter", name: "Starter Sword", type: "weapon" },
    },
    currency: {
      gold: 1234,
      gems: 56,
    },
    abilities: {
      hotbar: [
        { slot: 0, abilityId: "fireball", name: "Fireball", cooldown: 0 },
        { slot: 1, abilityId: null, name: undefined, cooldown: 0 },
        { slot: 2, abilityId: null, name: undefined, cooldown: 0 },
        { slot: 3, abilityId: null, name: undefined, cooldown: 0 },
      ],
      learned: [
        { abilityId: "fireball", name: "Fireball", level: 3 },
        { abilityId: "heal", name: "Heal", level: 2 },
        { abilityId: "shield", name: "Shield", level: 1 },
      ],
    },
    stats: {
      hp: 85,
      maxHp: 150,
      mana: 60,
      maxMana: 100,
      level: 10,
      xp: 850,
      xpToNextLevel: 1000,
    },
  };

  const state = displayedState || mockState;
  const isMock = !displayedState;

  // Safety checks for state structure
  const safeState = {
    ...state,
    abilities: {
      hotbar: state.abilities?.hotbar || [],
      learned: state.abilities?.learned || [],
    },
    inventory: {
      items: state.inventory?.items || [],
      maxSize: state.inventory?.maxSize || 36,
    },
    equipment: state.equipment || {},
    currency: state.currency || { gold: 0 },
    stats: state.stats || {
      hp: 0,
      maxHp: 100,
      mana: 0,
      maxMana: 100,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
    },
    versions: state.versions || {
      inventory: 0,
      equipment: 0,
      currency: 0,
      abilities: 0,
      stats: 0,
    },
  };

  return (
    <div className="p-4 space-y-4">
      {/* Connection Status */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-green-400 mb-2">
          {isConnected ? "✅ Connected" : "❌ Disconnected"}
        </h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Subscribed: {isSubscribed ? "Yes" : "No"}</p>
          <p>Ready: {isReady ? "Yes" : "No"}</p>
          {!isMock && <p>Pending Actions: {pendingActions.size}</p>}
          {isMock && (
            <p className="text-yellow-400 mt-2">⚠️ Using mock data (server not responding)</p>
          )}
        </div>
      </div>

      {/* State Versions */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-blue-400 mb-2">State Versions</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Inventory: v{safeState.versions.inventory}</p>
          <p>Equipment: v{safeState.versions.equipment}</p>
          <p>Currency: v{safeState.versions.currency}</p>
          <p>Abilities: v{safeState.versions.abilities}</p>
          <p>Stats: v{safeState.versions.stats}</p>
        </div>
      </div>

      {/* Player Stats */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-purple-400 mb-2">Player Stats</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Level: {safeState.stats.level}</p>
          <p>HP: {safeState.stats.hp}/{safeState.stats.maxHp}</p>
          <p>Mana: {safeState.stats.mana}/{safeState.stats.maxMana}</p>
          <p>XP: {safeState.stats.xp}/{safeState.stats.xpToNextLevel}</p>
        </div>
      </div>

      {/* Currency */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-yellow-400 mb-2">Currency</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <p>Gold: {safeState.currency.gold}</p>
          {safeState.currency.gems !== undefined && (
            <p>Gems: {safeState.currency.gems}</p>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-green-400 mb-2">
          Inventory ({safeState.inventory.items.length}/{safeState.inventory.maxSize})
        </h3>
        <div className="space-y-1">
          {safeState.inventory.items.map((item, index) => (
            <div 
              key={index}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => !isMock && equipItem(index)}
              title={isMock ? "Connect server to enable actions" : "Click to equip"}
            >
              <span>
                Slot {index}: {item.name}
              </span>
              <span className="text-gray-500">x{item.quantity}</span>
            </div>
          ))}
          {safeState.inventory.items.length === 0 && (
            <p className="text-xs text-gray-500">Empty inventory</p>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-orange-400 mb-2">Equipment</h3>
        <div className="space-y-1">
          {Object.entries(safeState.equipment).map(([slot, item]) => (
            <div 
              key={slot}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => !isMock && unequipItem(slot)}
              title={isMock ? "Connect server to enable actions" : "Click to unequip"}
            >
              <span className="capitalize">{slot}:</span>
              <span>{item.name}</span>
            </div>
          ))}
          {Object.keys(safeState.equipment).length === 0 && (
            <p className="text-xs text-gray-500">No equipment</p>
          )}
        </div>
      </div>

      {/* Abilities */}
      <div className="bg-gray-800 rounded p-3">
        <h3 className="text-sm font-bold text-cyan-400 mb-2">Abilities Hotbar</h3>
        <div className="space-y-1">
          {safeState.abilities.hotbar.map((slot) => (
            <div key={slot.slot} className="flex justify-between text-xs text-gray-300">
              <span>Slot {slot.slot + 1}:</span>
              <span>{slot.name || slot.abilityId || "Empty"}</span>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-bold text-cyan-400 mt-3 mb-2">Learned Abilities</h3>
        <div className="space-y-1">
          {safeState.abilities.learned.map((ability) => (
            <div 
              key={ability.abilityId}
              className="flex justify-between text-xs text-gray-300 hover:bg-gray-700 p-1 rounded cursor-pointer"
              onClick={() => !isMock && equipAbility(0, ability.abilityId)}
              title={isMock ? "Connect server to enable actions" : "Click to equip to slot 1"}
            >
              <span>{ability.name}</span>
              <span className="text-gray-500">Lv {ability.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-800 rounded p-3 space-y-2">
        <h3 className="text-sm font-bold text-white mb-2">🎮 Test Actions</h3>
        
        <button
          onClick={requestSync}
          disabled={isMock}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded transition-colors"
          title={isMock ? "Server not connected" : "Request full state sync from server"}
        >
          🔄 Request Sync
        </button>

        {safeState.inventory.items.length >= 2 && (
          <button
            onClick={() => {
              // System uses array indices as slot numbers
              swapInventorySlots(0, 1);
            }}
            disabled={isMock}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded transition-colors"
            title={isMock ? "Server not connected" : "Swap first two inventory items"}
          >
            🔀 Swap Slots 0 ↔️ 1
          </button>
        )}

        {safeState.inventory.items.length > 0 && (
          <button
            onClick={() => {
              // System uses array index 0 for first item
              equipItem(0);
            }}
            disabled={isMock}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded transition-colors"
            title={isMock ? "Server not connected" : `Equip ${safeState.inventory.items[0]?.name}`}
          >
            ⚔️ Equip: {safeState.inventory.items[0]?.name}
          </button>
        )}

        {Object.keys(safeState.equipment).length > 0 && (
          <button
            onClick={() => {
              const firstSlot = Object.keys(safeState.equipment)[0];
              unequipItem(firstSlot);
            }}
            disabled={isMock}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-2 px-3 rounded transition-colors"
            title={isMock ? "Server not connected" : `Unequip from ${Object.keys(safeState.equipment)[0]}`}
          >
            📤 Unequip: {Object.keys(safeState.equipment)[0]}
          </button>
        )}
      </div>

      {/* Pending Actions Display */}
      {!isMock && pendingActions.size > 0 && (
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded p-3">
          <h3 className="text-sm font-bold text-yellow-300 mb-2">
            ⏳ Pending Actions ({pendingActions.size})
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

      {/* Error Display */}
      {!isMock && lastError && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3">
          <h3 className="text-sm font-bold text-red-300 mb-2">❌ Error</h3>
          <p className="text-xs text-red-200">{lastError}</p>
        </div>
      )}

      {/* Server Setup Info */}
      {isMock && (
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded p-3">
          <h3 className="text-sm font-bold text-yellow-300 mb-2">
            📡 Server Not Responding
          </h3>
          <p className="text-xs text-yellow-200 mb-2">
            The personal channel is not receiving data from the server.
          </p>
          <p className="text-xs text-yellow-200">
            Your server needs to:
          </p>
          <ul className="text-xs text-yellow-200 list-disc list-inside mt-1">
            <li>Listen for `personalChannel:subscribe`</li>
            <li>Emit `personalState:init` with player state</li>
          </ul>
          <p className="text-xs text-gray-400 mt-2">
            See SERVER_REQUIREMENTS.md for details
          </p>
        </div>
      )}
    </div>
  );
};

export default MockPersonalChannelDemo;
