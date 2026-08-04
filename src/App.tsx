import { GameState } from "./components/GameState";
import { TwitchAuthGate } from "./components/ui/TwitchAuthGate";
import { useAuthStore } from "./hooks/useAuthStore";
import { Overlay } from "./pages/Overlay";
import { Panel } from "./pages/Panel";

// Opt-in, not opt-out. The old `!== "false"` test meant a missing env var
// silently shipped an extension with no backend, auth or socket at all.
const DISABLE_BACKEND = import.meta.env.VITE_DISABLE_BACKEND === "true";

export const App: React.FC<{ extType: "overlay" | "panel" }> = ({ extType }) => {
  const { token, channelId, isAuthenticated } = useAuthStore();

  return (
    <div className="font-family-sans">
      {DISABLE_BACKEND ? (
        extType === "overlay" ? (
          <Overlay />
        ) : (
          extType === "panel" && <Panel />
        )
      ) : (
        <TwitchAuthGate>
          {isAuthenticated && token && channelId ? (
            <GameState token={token} channelId={channelId}>
              {extType === "overlay" && <Overlay />}
              {extType === "panel" && <Panel />}
            </GameState>
          ) : (
            <div>Preparing your session...</div>
          )}
        </TwitchAuthGate>
      )}
    </div>
  );
};
