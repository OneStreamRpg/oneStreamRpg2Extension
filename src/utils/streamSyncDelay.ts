import { useSocketStore } from "../store/socketStore";

export function getStreamSyncDelay(): number {
  const { streamDelay, pingToStreamer, ping } = useSocketStore.getState();
  return Math.max(0, 500 + streamDelay * 1000 - pingToStreamer / 2 + (ping ?? 0) / 2);
}
