import { create } from "zustand";

const STORAGE_KEY = "osrpg.videoSyncOffset";
// v2: the automatic factor was rebaselined, so any slider value saved against
// the old baseline would stack on top of the change and read far too big.
const UI_SCALE_STORAGE_KEY = "osrpg.uiScale.v2";

// The user-facing slider is centered on 0, but 0 really means
// OBS_PROCESSING_BUFFER_MS (see utils/streamSyncDelay.ts). The offset is what
// the viewer adds/removes on top of that baseline, in milliseconds.
// These bounds only shape the slider — typed values are not limited to them,
// since some setups are off by whole seconds.
export const VIDEO_SYNC_SLIDER_MIN = -500;
export const VIDEO_SYNC_SLIDER_MAX = 1000;
export const VIDEO_SYNC_SLIDER_STEP = 10;

const normalizeOffset = (value: number) =>
  Number.isFinite(value) ? Math.round(value) : 0;

const loadOffset = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return 0;
    return normalizeOffset(Number(stored));
  } catch {
    // localStorage can be blocked inside the Twitch iframe — fall back to default
    return 0;
  }
};

// The interface already scales itself with the player (see UiScale). This is a
// personal multiplier on top of that, for viewers who want it chunkier or want
// more of the stream visible.
export const UI_SCALE_MIN = 0.5;
export const UI_SCALE_MAX = 1.5;
export const UI_SCALE_STEP = 0.05;

const loadUiScale = (): number => {
  try {
    const stored = localStorage.getItem(UI_SCALE_STORAGE_KEY);
    if (stored === null) return 1;
    const parsed = Number(stored);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, parsed));
  } catch {
    return 1;
  }
};

type SettingsState = {
  videoSyncOffset: number;
  uiScale: number;
};

type SettingsActions = {
  setVideoSyncOffset: (offset: number) => void;
  resetVideoSyncOffset: () => void;
  setUiScale: (scale: number) => void;
  resetUiScale: () => void;
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  videoSyncOffset: loadOffset(),
  uiScale: loadUiScale(),

  setVideoSyncOffset: (offset) => {
    const normalized = normalizeOffset(offset);
    try {
      localStorage.setItem(STORAGE_KEY, String(normalized));
    } catch {
      // ignore write failures, the value still applies for this session
    }
    set({ videoSyncOffset: normalized });
  },

  resetVideoSyncOffset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ videoSyncOffset: 0 });
  },

  setUiScale: (scale) => {
    const normalized = Number.isFinite(scale)
      ? Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, scale))
      : 1;
    try {
      localStorage.setItem(UI_SCALE_STORAGE_KEY, String(normalized));
    } catch {
      // ignore write failures, the value still applies for this session
    }
    set({ uiScale: normalized });
  },

  resetUiScale: () => {
    try {
      localStorage.removeItem(UI_SCALE_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ uiScale: 1 });
  },
}));
