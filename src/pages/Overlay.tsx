import TwitchAuthGate from "../components/ui/TwitchAuthGate";
import ConnectedOverlay from "./ConnectedOverlay";

const Overlay = () => {
  return (
    <TwitchAuthGate>
      <ConnectedOverlay />
    </TwitchAuthGate>
  );
};

export default Overlay;
