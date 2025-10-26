import { DebugOverlay } from "../components/DebugOverlay";
import { UserInterface } from "../components/UserInterface";
import { WorldInteractionLayer } from "../components/WorldInteractionLayer";

export const Overlay = () => {
  return (
    <div className="grid grid-cols-1 grid-rows-1 h-screen w-screen">
      <div className="col-start-1 row-start-1">
        <WorldInteractionLayer />
      </div>
      <div className="col-start-1 row-start-1 pointer-events-none">
        <UserInterface />
      </div>
      <div className="col-start-1 row-start-1 pointer-events-none">
        <DebugOverlay />
      </div>
    </div>
  );
};
