import type { TownCapacityStatus } from "../types/townCapacity";

interface JoinGameScreenProps {
  status: "idle" | "joining" | "connecting" | "offline" | "error" | "queued";
  error?: string | null;
  /**
   * Why the viewer is no longer in the queue when they didn't leave on purpose
   * (waited out the TTL, or the promotion errored). Not an error they caused,
   * so it reads as an explanation rather than a failure.
   */
  notice?: string | null;
  capacity?: TownCapacityStatus | null;
  /** 1-based place in line. */
  queuePosition?: number | null;
  queueLength?: number;
  /** The broadcaster joins a full town directly, so queue talk doesn't apply. */
  canBypassQueue?: boolean;
  onJoin?: () => void;
  onLeaveQueue?: () => void;
}

const Occupancy: React.FC<{ capacity: TownCapacityStatus }> = ({ capacity }) => (
  <span className="text-xs text-gray-400">
    {capacity.players}/{capacity.maxPlayers} in town
    {capacity.queueLength > 0 && ` · ${capacity.queueLength} waiting`}
  </span>
);

export const JoinGameScreen: React.FC<JoinGameScreenProps> = ({
  status,
  error,
  notice,
  capacity,
  queuePosition,
  queueLength,
  canBypassQueue,
  onJoin,
  onLeaveQueue,
}) => {
  // Waiting in line is the one state a viewer sits in for a long time, and
  // there is nothing for them to do in it — the head of the queue is pulled in
  // automatically. So it stays out of the middle of the stream: a slim bar at
  // the top, click-through everywhere except the bar itself.
  if (status === "queued") {
    const innHelps = capacity?.inn ? !capacity.inn.maxLevel : false;

    return (
      <div className="fixed inset-x-0 top-0 flex justify-center pt-3 px-3 pointer-events-none">
        <div
          className="pointer-events-auto flex flex-col gap-0.5 px-3 py-2 rounded"
          style={{
            backgroundColor: "rgba(10,5,2,0.85)",
            border: "1px solid #9a7228",
            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <span className="font-bold" style={{ color: "#f0d060" }}>
              #{queuePosition}
            </span>
            <span className="text-gray-300">
              in line{queueLength ? ` of ${queueLength}` : ""}
            </span>
            {capacity && (
              <span className="text-gray-500">
                · {capacity.players}/{capacity.maxPlayers} in town
              </span>
            )}
            <button
              onClick={onLeaveQueue}
              className="ml-2 text-gray-400 hover:text-white cursor-pointer underline"
            >
              Leave
            </button>
          </div>

          {innHelps && (
            <span className="text-gray-500" style={{ fontSize: "11px" }}>
              Upgrading the Inn lets more people play at once.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen pointer-events-none">
      <div className="pointer-events-auto bg-gray-900/90 border border-gray-700 p-6 flex flex-col items-center gap-4 min-w-48">
        <span className="text-white text-sm font-semibold tracking-wide">OneStream RPG</span>

        {status === "connecting" && (
          <span className="text-gray-400 text-xs">Connecting…</span>
        )}

        {status === "offline" && (
          <span className="text-gray-400 text-xs text-center">
            This streamer isn’t running the game right now.
            <br />
            It’ll start on its own once they do.
          </span>
        )}

        {status === "error" && (
          <span className="text-red-400 text-xs text-center">
            {error ?? "Can’t reach the game server."}
          </span>
        )}

        {(status === "idle" || status === "joining") && (
          <>
            {notice && (
              <span className="text-xs text-center" style={{ color: "#f0d8a8" }}>
                {notice}
              </span>
            )}
            {error && (
              <span className="text-red-400 text-xs text-center">{error}</span>
            )}
            <button
              onClick={onJoin}
              disabled={status === "joining"}
              className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black text-sm font-bold px-6 py-2 transition-colors w-full"
            >
              {status === "joining" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                  Joining…
                </span>
              ) : error ? (
                "Retry"
              ) : (
                "Join Game"
              )}
            </button>

            {capacity && <Occupancy capacity={capacity} />}
            {capacity?.full && !canBypassQueue && (
              <span className="text-xs text-center text-gray-400">
                The town is full — joining puts you in line.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
