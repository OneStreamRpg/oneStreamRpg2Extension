import { useSettingsStore } from "../store/useSettingsStore";
import { useSocketStore } from "../store/socketStore";

// Twitch's hlsLatencyBroadcaster only measures from ingest onwards — it does not
// include the time the broadcaster's encoder (OBS) needs to capture and encode
// the frame. 500ms is a decent average for a normal PC, but it varies per setup,
// which is why viewers can nudge it with the video sync slider in settings.
export const OBS_PROCESSING_BUFFER_MS = 500;

export function getStreamSyncDelay(): number {
  const { streamDelay, pingToStreamer, ping } = useSocketStore.getState();
  const { videoSyncOffset } = useSettingsStore.getState();
  return Math.max(
    0,
    OBS_PROCESSING_BUFFER_MS +
      videoSyncOffset +
      streamDelay * 1000 -
      pingToStreamer / 2 +
      (ping ?? 0) / 2
  );
}
