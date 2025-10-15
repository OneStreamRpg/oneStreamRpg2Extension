# Optimistic UI & Server Communication Guide

## Overview

The Personal Player Channel uses an **optimistic update pattern** with automatic rollback to provide instant UI feedback while maintaining server authority. This creates a responsive user experience (0ms perceived latency) while ensuring data consistency.

---

## 🔄 Complete Communication Flow

### 1. **User Action** → Optimistic Update (0ms)

```
User clicks "Swap Inventory" button
         ↓
Client applies change to UI IMMEDIATELY
         ↓
UI shows swapped items (optimistic state)
```

**What happens:**
- Generate unique `actionId` (e.g., `"1759929130948-7j9qtauki"`)
- Generate sequence number `seq` (incrementing counter: 0, 1, 2, 3...)
- Clone current confirmed state
- Apply action logic locally
- Update `displayedState` (what user sees)
- Store action in `pendingActions` Map with before-state snapshot
- Add action to "Pending Actions" display

**Code location:** `usePersonalChannelActions.ts` → `applyOptimisticUpdate()`

---

### 2. **Send to Server** (50-150ms)

```
Client → Server: personalChannel:action
{
  actionId: "1759929130948-7j9qtauki",
  seq: 3,
  type: "swapInventorySlots",
  params: { slot1: 0, slot2: 1 },
  timestamp: 1759929130948
}
```

**What happens:**
- Socket.IO emits the action to server
- Server receives action
- Server validates the action
- Server applies action to authoritative database
- Server prepares response

**Code location:** `usePersonalChannelActions.ts` → `socket.emit("personalChannel:action")`

---

### 3. **Server Acknowledgment** (50-150ms later)

```
Server → Client: personalState:ack
{
  actionId: "1759929130948-7j9qtauki",
  seq: 3,
  success: true,
  delta: {
    versions: { inventory: 45 },
    inventory: {
      items: [
        { slotNumber: 0, itemId: "helm_1", name: "Iron Helmet", ... },
        { slotNumber: 1, itemId: "sword_1", name: "Iron Sword", ... }
      ],
      maxSize: 36
    }
  },
  timestamp: 1759929131071
}
```

**What happens:**
- Client receives acknowledgment
- If `success: true`:
  - Remove action from `pendingActions` Map
  - Apply server's authoritative delta (overrides optimistic state)
  - Update `confirmedState` with server's version
  - Update version numbers to prevent stale updates
  - Remove from "Pending Actions" display
- If `success: false`:
  - Rollback optimistic changes
  - Restore from before-state snapshot
  - Show error message to user

**Code location:** `usePersonalChannel.ts` → `socket.on("personalState:ack")` → `confirmAction()` or `rollbackAction()`

---

### 4. **Delta Synchronization** (Ongoing, ~50ms intervals)

```
Server → Client: personalState:delta
{
  versions: { stats: 123, currency: 45 },
  stats: {
    hp: 82,
    maxHp: 150,
    mana: 55,
    maxMana: 100
  },
  currency: {
    gold: 1350,
    gems: 58
  }
}
```

**What happens:**
- Server sends only **changed domains** (not full state)
- Client checks version numbers to prevent stale updates
- If version is newer: apply delta to state
- If version is older: reject (stale data)
- Updates both `displayedState` and `confirmedState`

**Why:** Server-side events (combat damage, quest rewards, other players) need to update client state without user action.

**Code location:** `usePersonalChannel.ts` → `socket.on("personalState:delta")` → `applyDelta()`

---

## 📊 State Management Architecture

### Three State Layers

```
┌─────────────────────────────────────────────┐
│  displayedState (What user sees)            │
│  - Includes optimistic updates              │
│  - Updated immediately on user action       │
│  - Rendered in UI components                │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  confirmedState (Server truth)              │
│  - Last confirmed by server                 │
│  - Used for rollback on failure             │
│  - Updated only on server ack               │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  pendingActions Map<actionId, PendingAction>│
│  - Tracks unconfirmed actions              │
│  - Stores before-state for rollback        │
│  - Cleared on acknowledgment               │
└─────────────────────────────────────────────┘
```

### State Domains (Independent Versioning)

Each domain has its own version number to prevent race conditions:

- `inventory` - Items in backpack
- `equipment` - Worn items (helmet, chest, mainHand, etc.)
- `currency` - Gold, gems, tokens
- `abilities` - Hotbar + learned abilities
- `stats` - HP, mana, level, XP

**Example:** Inventory version 45, Equipment version 23, Stats version 156

---

## 🎯 Example Scenarios

### ✅ Success Case: Swap Inventory Items

```
Time    Event
────────────────────────────────────────────────────
0ms     User clicks "Swap Slots 0 ↔️ 1"
        → UI updates instantly (slots swapped)
        → Action stored in pendingActions
        → "Pending Actions (1)" shown

1ms     Socket emits to server
        → personalChannel:action sent

52ms    Server processes action
        → Validates slots exist
        → Swaps in database
        → Prepares delta response

104ms   Client receives ack
        → personalState:ack (success: true)
        → Removes from pendingActions
        → Applies server delta (authoritative)
        → "Pending Actions (0)" - cleared!

Result: User saw instant feedback, server confirmed
```

### ❌ Failure Case: Equip Invalid Item

```
Time    Event
────────────────────────────────────────────────────
0ms     User clicks "Equip Item"
        → UI shows item equipped (optimistic)
        → Action stored in pendingActions

1ms     Socket emits to server

52ms    Server rejects action
        → Item doesn't exist (deleted by other player)
        → Or level requirement not met

104ms   Client receives ack
        → personalState:ack (success: false, error: "Item not found")
        → Rollback triggered
        → UI reverts to confirmedState
        → Error message shown: "❌ Item not found"

Result: User sees brief flash, then rollback with error
```

### 🔄 Multiple Pending Actions

```
Time    Event
────────────────────────────────────────────────────
0ms     User clicks "Swap" (seq: 0)
        → Optimistic update applied
        → pendingActions.size = 1

50ms    User clicks "Equip" (seq: 1)
        → Optimistic update applied on top of seq:0
        → pendingActions.size = 2

100ms   Ack for seq:0 arrives (success)
        → Confirmed, removed from pending
        → pendingActions.size = 1

150ms   Ack for seq:1 arrives (success)
        → Confirmed, removed from pending
        → pendingActions.size = 0

Result: Both actions confirmed in sequence order
```

### 🚨 Rollback with Remaining Pending

```
Time    Event
────────────────────────────────────────────────────
0ms     User clicks "Swap" (seq: 0)
        → pendingActions.size = 1

50ms    User clicks "Equip" (seq: 1)
        → pendingActions.size = 2

100ms   Ack for seq:0 arrives (FAIL)
        → Rollback seq:0
        → Restore to confirmedState
        → Reapply seq:1 on top
        → pendingActions.size = 1 (only seq:1 remains)

150ms   Ack for seq:1 arrives (success)
        → pendingActions.size = 0

Result: First action failed, second action preserved
```

---

## 🛡️ Race Condition Prevention

### Version Numbers

Each state domain tracks a version number that increments on every change:

```typescript
versions: {
  inventory: 45,
  equipment: 23,
  currency: 156,
  abilities: 12,
  stats: 789
}
```

**When delta arrives:**
```typescript
if (receivedVersion < currentVersion) {
  console.warn("⚠️ Rejecting stale delta");
  return; // Ignore old data
}
```

**Why:** Prevents out-of-order network packets from corrupting state.

---

## 🔌 Socket Events Reference

### Client → Server

| Event | Purpose | Payload |
|-------|---------|---------|
| `personalChannel:subscribe` | Request to join personal channel | `{}` |
| `personalChannel:action` | Send player action | `{ actionId, seq, type, params, timestamp }` |
| `personalChannel:sync` | Request full state resync | `{}` |

### Server → Client

| Event | Purpose | Payload |
|-------|---------|---------|
| `personalState:init` | Initial state on subscribe | Full `PlayerPersonalState` |
| `personalState:ack` | Acknowledge action result | `{ actionId, seq, success, delta?, error?, timestamp }` |
| `personalState:delta` | Push state changes | `{ versions, ...domains }` |
| `personalState:sync` | Full state resync response | Full `PlayerPersonalState` |
| `personalState:error` | Error notification | `{ message }` |

---

## 🔧 Implementation Details

### Action ID Generation

```typescript
const actionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
// Example: "1759929130948-7j9qtauki"
```

- Unique per action
- Used to match acknowledgments
- Prevents duplicate processing

### Sequence Numbers

```typescript
const seq = store.getNextSequence(); // 0, 1, 2, 3...
```

- Incrementing counter per session
- Ensures actions applied in order
- Used for rollback with multiple pending

### Optimistic Update Logic

```typescript
// 1. Clone confirmed state
const beforeState = structuredClone(confirmedState);

// 2. Apply action logic
const newState = applyActionToState(action, beforeState);

// 3. Update displayed state (instant UI)
store.applyOptimisticUpdate(action, newState);

// 4. Send to server
socket.emit("personalChannel:action", action);
```

### Rollback Logic

```typescript
// 1. Get before-state snapshot
const pendingAction = pendingActions.get(actionId);
const beforeState = pendingAction.beforeState;

// 2. Restore confirmed state
let restoredState = structuredClone(confirmedState);

// 3. Reapply remaining pending actions in sequence
const remaining = Array.from(pendingActions.values())
  .filter(p => p.action.actionId !== actionId)
  .sort((a, b) => a.action.seq - b.action.seq);

for (const pending of remaining) {
  restoredState = applyActionToState(pending.action, restoredState);
}

// 4. Update displayed state
store.displayedState = restoredState;
```

---

## 📈 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Perceived Latency | **0ms** | Optimistic update is instant |
| Actual Round Trip | 50-150ms | Depends on network |
| Delta Size | ~100-500 bytes | Only changed domains |
| Full State Size | ~2-5 KB | Complete player state |
| Version Check Overhead | <1ms | Simple integer comparison |

---

## 🐛 Debugging

### Console Logs

Enable debug mode in browser console:
```javascript
personalChannelDebug.enable();
```

### Key Log Messages

- `⚡ Optimistic update applied` - Client applied action
- `📤 Sending action` - Sent to server
- `✉️ Action acknowledgment received` - Server responded
- `✅ Action confirmed` - Removed from pending
- `📦 Personal Channel: Delta applied` - Server pushed update
- `❌ Action failed - Rolling back` - Server rejected action
- `⚠️ Rejecting stale delta` - Old version prevented race

### Check State

```javascript
// Get current state
personalChannelDebug.state();

// Get statistics
personalChannelDebug.stats();

// View pending actions
personalChannelDebug.pending();
```

---

## 🎓 Key Takeaways

1. **Instant Feedback**: User sees changes immediately (0ms)
2. **Server Authority**: Server's delta always wins
3. **Automatic Rollback**: Failed actions revert transparently
4. **Version Protection**: Race conditions prevented by version numbers
5. **Delta Efficiency**: Only changed domains transmitted
6. **Sequence Preservation**: Multiple actions maintained in order
7. **Transparent to User**: Complexity hidden, feels instant

---

## 📚 Related Documentation

- `PERSONAL_CHANNEL_IMPLEMENTATION.md` - Full technical details
- `SERVER_REQUIREMENTS.md` - Server-side implementation guide
- `PERSONAL_CHANNEL_QUICK_START.md` - Quick reference
- `MIGRATION_GUIDE.md` - Integration instructions

---

**Last Updated:** October 10, 2025
