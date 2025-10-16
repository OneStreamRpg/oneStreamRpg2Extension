import { TwitchAuthGate } from "./components/ui/TwitchAuthGate";
import { SocketProvider } from "./context/SocketProvider";
import { useAuthStore } from "./hooks/useAuthStore";
import Overlay from "./pages/Overlay";
import Panel from "./pages/Panel";

const extType = import.meta.env.VITE_EXT_TYPE;

export const App: React.FC = () => {

  if (extType !== "panel" && extType !== "overlay") {
    console.error("No valid extension type specified in .env");
  }


  const { token, channelId, isAuthenticated } = useAuthStore()

  return (
    <TwitchAuthGate>
      {isAuthenticated && token && channelId ? (<SocketProvider token={token} channelId={channelId}>
        {extType === "overlay" && <Overlay />}
        {extType === "panel" && <Panel />}
      </SocketProvider>) : <div>Preparing your session...</div>}
    </TwitchAuthGate>
  )
}

