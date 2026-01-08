import { useCallback, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useGameObjects } from "../hooks/useGameobjects";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { useSocketStore } from "../store/socketStore";
import ClickMarker from "./ui/ClickMarker";

export const WorldInteractionLayer: React.FC = () => {
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const socket = useSocketStore((state) => state.socket);
  const gameState = useSocketStore((state) => state.gameState);
  const gameObjects = useGameObjects(gameState);

  const { movePlayer } = usePersonalChannelActions(socket);

  const movePlayerRef = useRef(movePlayer);

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const section = sectionRef.current;
    if (!section) return;

    const bounds = section.getBoundingClientRect();

    // Raw coordinates for screen display (marker position)
    const rawX = e.clientX - bounds.left;
    const rawY = e.clientY - bounds.top;

    // Scaled coordinates for backend (1920x1080)
    const scaleX = 1920 / bounds.width;
    const scaleY = 1080 / bounds.height;
    const scaledX = rawX * scaleX;
    const scaledY = rawY * scaleY;

    console.log("Scaled coords for backend:", { x: scaledX, y: scaledY });
    movePlayerRef.current(scaledX, scaledY);

    // Display marker for 5000ms
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMarker({ x: rawX, y: rawY });
    timeoutRef.current = setTimeout(() => setMarker(null), 5000);
  }, []);

  return (
    <section
      ref={sectionRef}
      onClick={handleClick}
      className="size-full bg-cover bg-center bg-no-repeat bg-gray-500 relative cursor-crosshair"
      style={
        {
          // backgroundImage: "url(/media/img/layout/game_placeholder.png)",
        }
      }
    >
      {marker && <ClickMarker x={marker.x} y={marker.y} />}
      <Tooltip id="game-object-tooltip" />

      {gameObjects.map((obj) => (
        <div
          data-tooltip-id="game-object-tooltip"
          data-tooltip-content={obj.name + ": " + obj.type}
          data-tooltip-place="top"
          key={obj.id}
          onClick={(e) => {
            e.stopPropagation();
            console.log("Clicked game object:", obj);
          }}
          className="absolute pointer-events-auto cursor-pointer hover:bg-white/20 border border-white/30"
          style={{
            left: `${(obj.hitbox.x / 1920) * 100}%`,
            top: `${(obj.hitbox.y / 1080) * 100}%`,
            width: `${(obj.hitbox.width / 1920) * 100}%`,
            height: `${(obj.hitbox.height / 1080) * 100}%`,
          }}
        />
      ))}
    </section>
  );
};
