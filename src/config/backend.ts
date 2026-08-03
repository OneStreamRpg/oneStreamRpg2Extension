/**
 * Backend location.
 *
 * There is exactly one host — every lobby lives underneath it at
 * `/l/<twitchChannelId>/…` — so only this domain has to be allowlisted in the
 * Twitch developer console. Which lobby we talk to is decided at runtime from
 * `Twitch.ext.onAuthorized`, not baked into the bundle.
 */

const RAW_BASE =
  import.meta.env.VITE_API_BASE ??
  // Old name, kept so an un-updated .env still builds.
  import.meta.env.VITE_SOCKET_URL ??
  "";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

/** Socket.IO `path` option for a given broadcaster. */
export function socketIoPathFor(channelId: string): string {
  return `/l/${channelId}/socket.io`;
}

export interface LobbyStatus {
  online: boolean;
  lobbyId?: string;
}

/**
 * Asks the gateway whether this broadcaster is currently running the game.
 * Connecting blind would leave the viewer staring at "Connecting…" forever
 * whenever the streamer simply has not launched it.
 */
export async function fetchLobbyStatus(channelId: string): Promise<LobbyStatus> {
  const res = await fetch(`${API_BASE}/api/lobby/status/${channelId}`);
  if (res.status === 404) return { online: false };
  if (!res.ok) throw new Error(`Lobby status failed with ${res.status}`);

  const body = (await res.json()) as LobbyStatus;
  return { online: !!body.online, lobbyId: body.lobbyId };
}
