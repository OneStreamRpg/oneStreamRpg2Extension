import { JoinGameScreen } from "../components/JoinGameScreen";
import { UserInterface } from "../components/UserInterface";
import { UiScale } from "../components/ui/UiScale";
import { WorldInteractionLayer } from "../components/WorldInteractionLayer";
import { useAuthStore } from "../hooks/useAuthStore";
import { useSocketStore } from "../store/socketStore";

export const Overlay = () => {
  const {
    isConnected, inGame, isDying, joinStatus, joinError, joinGameFn,
    lobbyOnline, connectionError,
    capacity, queuePosition, queueLength, queueNotice, canBypassQueue, leaveQueueFn,
  } = useSocketStore();
  const { profile } = useAuthStore();

  if (!isConnected) {
    // Tell "the streamer hasn't launched the game" apart from "something is
    // broken" — otherwise both look like an endless Connecting… spinner.
    if (lobbyOnline === false) return <JoinGameScreen status="offline" />;
    if (connectionError) return <JoinGameScreen status="error" error={connectionError} />;
    return <JoinGameScreen status="connecting" />;
  }

  if (!inGame && !isDying) {
    // Waiting in line outranks the join button: the viewer already asked to
    // play and there is nothing left for them to press.
    return (
      <JoinGameScreen
        status={
          queuePosition !== null
            ? "queued"
            : joinStatus === "joining"
              ? "joining"
              : "idle"
        }
        error={joinError}
        notice={queueNotice}
        capacity={capacity}
        queuePosition={queuePosition}
        queueLength={queueLength}
        canBypassQueue={canBypassQueue}
        onJoin={() => joinGameFn?.(profile?.login ?? "")}
        onLeaveQueue={() => leaveQueueFn?.()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 grid-rows-1 h-screen w-screen">
      <div className="col-start-1 row-start-1">
        <WorldInteractionLayer />
      </div>
      <div className="col-start-1 row-start-1 pointer-events-none z-10">
        <UiScale>
          <UserInterface />
        </UiScale>
      </div>
    </div>
  );
};
