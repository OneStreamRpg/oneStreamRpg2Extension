import { TwitchAuthGate } from "./components/ui/TwitchAuthGate";
import Overlay from "./pages/Overlay";
import Panel from "./pages/Panel";

const extType = import.meta.env.VITE_EXT_TYPE;

export const App: React.FC = () => {

  if (extType !== "panel" && extType !== "overlay") {
    console.error("No valid extension type specified in .env");
  }

  return (
    <TwitchAuthGate>
      {extType === "overlay" && <Overlay />}
      {extType === "panel" && <Panel />}
    </TwitchAuthGate>
  )
}

