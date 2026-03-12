import { DebugOverlay } from "../components/DebugOverlay";
import { JoinGameScreen } from "../components/JoinGameScreen";
import { UserInterface } from "../components/UserInterface";
import { WorldInteractionLayer } from "../components/WorldInteractionLayer";
import { useAuthStore } from "../hooks/useAuthStore";
import { useSocketStore } from "../store/socketStore";

const DEBUG_MODE = import.meta.env.VITE_DEVELOPER === "true";

export const Overlay = () => {
  const { isConnected, inGame, joinStatus, joinError, joinGameFn } = useSocketStore();
  const { profile } = useAuthStore();

  if (!isConnected) {
    return <JoinGameScreen status="connecting" />;
  }

  if (!inGame) {
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
        <UserInterface />
      </div>
      {DEBUG_MODE && (
        <div className="col-start-1 row-start-1 pointer-events-none z-20">
          <DebugOverlay />
        </div>
      )}
    </div>
  );
};
