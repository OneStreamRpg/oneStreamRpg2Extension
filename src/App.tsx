import { GameState } from "./components/GameState";
import { TwitchAuthGate } from "./components/ui/TwitchAuthGate";
import { useAuthStore } from "./hooks/useAuthStore";
import { Overlay } from "./pages/Overlay";
import { Panel } from "./pages/Panel";

const DISABLE_BACKEND = import.meta.env.VITE_DISABLE_BACKEND;

export const App: React.FC<{ extType: "overlay" | "panel" }> = ({ extType }) => {
  const { token, channelId, isAuthenticated } = useAuthStore();

  return (
    <div className="font-family-sans">
      {DISABLE_BACKEND !== "false" ? (
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
