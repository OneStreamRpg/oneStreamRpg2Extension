// Town capacity and the join queue.
//
// The Inn caps how many viewers fit in the town at once (20 base, +20 per Inn
// level). Joining a full town is not a failure: the viewer is put in a strict
// FIFO line and pulled in automatically the moment a slot frees. There is
// nothing to claim and nothing to click — the UI's whole job is to show where
// they stand and what the Inn still needs.

export interface InnRequirement {
  itemId: string;
  quantity: number;
  /** Already deposited, capped at `quantity` — so `quantity - deposited` is what's left. */
  deposited: number;
}

export interface InnStatus {
  /** 0 = burned down (needs rebuilding), 2 = maxed. */
  level: number;
  maxLevel: boolean;
  /** What maxPlayers becomes after the next Inn level. Null when maxed. */
  nextLevelMaxPlayers: number | null;
  requirements: InnRequirement[];
  /** Summed across materials, so one bar covers the whole upgrade. */
  progress: number;
  progressMax: number;
}

/** Rides along with every queue-related message. */
export interface TownCapacityStatus {
  /**
   * Can exceed `maxPlayers`: the broadcaster bypasses the queue, so 21/20 is a
   * correct reading. Never assume this is bounded by maxPlayers.
   */
  players: number;
  maxPlayers: number;
  /** True when a join right now would queue instead of entering. */
  full: boolean;
  queueLength: number;
  /** Null only when the Inn isn't spawned at all. */
  inn: InnStatus | null;
}

// --- `join` action responses ------------------------------------------------
// Success is unchanged. A full town answers success: false with queued: true —
// a place in line, not an error, so it must not render as one.

export interface JoinedData {
  type: "joined";
  capacity: TownCapacityStatus;
}

export interface QueuedData {
  type: "queued";
  queued: true;
  /** 1-based. */
  position: number;
  queueLength: number;
  capacity: TownCapacityStatus;
}

export interface QueueFullData {
  type: "queueFull";
  queued: false;
  capacity: TownCapacityStatus;
}

export interface JoinFailedData {
  type: "joinFailed";
  queued: false;
  capacity: TownCapacityStatus;
}

export type JoinResponseData =
  | JoinedData
  | QueuedData
  | QueueFullData
  | JoinFailedData;

// --- queueStatus / leaveQueue actions ---------------------------------------
// Both are handled without a Player, so they work while the viewer is only
// waiting and the personal channel has nothing in it.

export interface QueueStatusData {
  type: "queueStatus";
  /** 1-based; null when the viewer isn't in line. */
  position: number | null;
  queueLength: number;
  capacity: TownCapacityStatus;
  /** See the note on InGameEvent. */
  canBypassQueue: boolean;
}

export interface LeaveQueueData {
  type: "leaveQueue";
  left: boolean;
  position: null;
  queueLength: number;
  capacity: TownCapacityStatus;
  /** See the note on InGameEvent. */
  canBypassQueue: boolean;
}

// --- events -----------------------------------------------------------------

/** Pushed to a waiting viewer whenever the line moves. */
export interface QueueUpdateEvent {
  /** Null means they're out of the line — `reason` says why, or they left. */
  position: number | null;
  queueLength: number;
  capacity: TownCapacityStatus;
  reason?: "expired" | "failed";
}

/**
 * Pushed to in-game players when occupancy changes. Deliberately not part of
 * the 16Hz delta — it only fires on an actual change.
 */
export type TownCapacityEvent = TownCapacityStatus;

/** The polled `inGame` event, now additive. Older clients read `inGame` alone. */
export interface InGameEvent {
  inGame: boolean;
  isDying?: boolean;
  /** Set when the viewer was pulled in off the queue rather than joining directly. */
  fromQueue?: boolean;
  queuePosition?: number | null;
  queueLength?: number;
  capacity?: TownCapacityStatus;
  /**
   * Per-viewer, true only for the broadcaster, who joins a full town without
   * queueing. Sits outside `capacity` because that object is shared: it is
   * broadcast to everyone, and this is not the same answer for everyone.
   */
  canBypassQueue?: boolean;
}
