import { DebugOverlay } from "../components/DebugOverlay";
import { JoinGameScreen } from "../components/JoinGameScreen";
import { UserInterface } from "../components/UserInterface";
import { UiScale } from "../components/ui/UiScale";
import { WorldInteractionLayer } from "../components/WorldInteractionLayer";
import { useAuthStore } from "../hooks/useAuthStore";
import { useSocketStore } from "../store/socketStore";

const DEBUG_MODE = import.meta.env.VITE_DEVELOPER === "true";

export const Overlay = () => {
  const { isConnected, inGame, isDying, joinStatus, joinError, joinGameFn, lobbyOnline, connectionError } =
    useSocketStore();
  const { profile } = useAuthStore();

  if (!isConnected) {
    // Tell "the streamer hasn't launched the game" apart from "something is
    // broken" — otherwise both look like an endless Connecting… spinner.
    if (lobbyOnline === false) return <JoinGameScreen status="offline" />;
    if (connectionError) return <JoinGameScreen status="error" error={connectionError} />;
    return <JoinGameScreen status="connecting" />;
  }

  if (!inGame && !isDying) {
    return (
      <JoinGameScreen
        status={joinStatus === "joining" ? "joining" : "idle"}
        error={joinError}
        onJoin={() => joinGameFn?.(profile?.login ?? "")}
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
      {DEBUG_MODE && (
        <div className="col-start-1 row-start-1 pointer-events-none z-20">
          <DebugOverlay />
        </div>
      )}
    </div>
  );
};
