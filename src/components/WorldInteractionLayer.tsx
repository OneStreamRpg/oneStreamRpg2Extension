import { useCallback, useMemo, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useGameObjects } from "../hooks/useGameobjects";
import { useNpcActions } from "../hooks/useNpcActions";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import ClickMarker from "./ui/ClickMarker";

const TAG = "WorldInteraction";
const DEBUG = import.meta.env.VITE_DEBUG_WORLD_INTERACTION === "true";
const EMPTY_QUESTS: { npcId: string }[] = [];

export const WorldInteractionLayer: React.FC = () => {
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const socket = useSocketStore((state) => state.socket);
  const gameState = useSocketStore((state) => state.gameState);
  const gameObjects = useGameObjects(gameState);
  const availableQuests = usePersonalChannelStore(
    (state) => state.displayedState?.quests?.available ?? EMPTY_QUESTS
  );
  const currentUsername = usePersonalChannelStore(
    (state) => state.displayedState?.profile?.username ?? null
  );
  const questNpcIds = useMemo(
    () => new Set(availableQuests.map((q) => q.npcId)),
    [availableQuests]
  );
  const { movePlayer, setTargetEnemy } = usePersonalChannelActions(socket);
  const { setTargetNpc } = useNpcActions(socket);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const section = sectionRef.current;
      if (!section) {
        logger.warn(TAG, "Click ignored: sectionRef not available");
        return;
      }

      const bounds = section.getBoundingClientRect();

      // Raw coordinates for screen display (marker position)
      const rawX = e.clientX - bounds.left;
      const rawY = e.clientY - bounds.top;

      // Scaled coordinates for backend (1920x1080)
      const scaleX = 1920 / bounds.width;
      const scaleY = 1080 / bounds.height;
      const scaledX = rawX * scaleX;
      const scaledY = rawY * scaleY;

      logger.debug(
        TAG,
        `Player move requested: x=${Math.round(scaledX)}, y=${Math.round(
          scaledY
        )}`
      );
      movePlayer(scaledX, scaledY);

      // Display marker for 5000ms
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMarker({ x: rawX, y: rawY });
      timeoutRef.current = setTimeout(() => setMarker(null), 5000);
    },
    [movePlayer]
  );

  return (
    <section
      ref={sectionRef}
      onClick={handleClick}
      className="size-full bg-cover bg-center bg-no-repeat relative"
      style={
        {
          // backgroundImage: "url(/media/img/layout/game_placeholder.png)",
        }
      }
    >
      {marker && <ClickMarker x={marker.x} y={marker.y} />}
      <Tooltip id="game-object-tooltip" style={{ zIndex: 9999 }} />

      {gameObjects.map((obj) => {
        let metadata = null;
        if (obj.type === "npc") {
          const npc = metadataService.getNpcSync(obj.npcId);
          metadata = `${npc ? npc.name + " (NPC)" : "Unknown NPC, npcId is: " + obj.npcId
            }`;
        } else if (obj.type === "enemy") {
          const enemy = metadataService.getEnemySync(obj.enemyId);

          metadata = `${enemy
            ? enemy.name + " (Enemy)"
            : "Unknown Enemy, enemyId is: " + obj.enemyId
            }`;
        } else if (obj.type === "player") {
          metadata = `Player: ${obj.username}`;
        }

        return (
          <div
            data-tooltip-id="game-object-tooltip"
            data-tooltip-content={
              metadata ? metadata : "No metadata found for: " + obj.id
            }
            data-tooltip-place="top"
            key={obj.id}
            onClick={(e) => {
              e.stopPropagation();
              logger.debug(TAG, `Game object clicked: `, { obj, metadata });

              if (obj.type === "enemy") {
                setTargetEnemy(obj.id);
              } else if (obj.type === "npc") {
                setTargetNpc(obj.npcId);
              }
            }}
            className={`absolute pointer-events-auto ${obj.type === "enemy"
              ? "cursor-crosshair"
              : obj.type === "npc"
                ? "cursor-pointer"
                : "cursor-pointer"
              } ${DEBUG ? ("hover:bg-white/20 border border-white/30" + (obj.type === "player" ? " bg-green-500/20" : "")) : ""} ${!obj.id ? "bg-red-500" : ""
              }`}
            style={{
              left: `${((obj.hitbox.x - obj.hitbox.width * obj.hitbox.xOffsetRatio) /
                1920) *
                100
                }%`,
              top: `${((obj.hitbox.y - obj.hitbox.height * obj.hitbox.yOffsetRatio) /
                1080) *
                100
                }%`,
              width: `${(obj.hitbox.width / 1920) * 100}%`,
              height: `${(obj.hitbox.height / 1080) * 100}%`,
            }}
          >
            {obj.type === "npc" && questNpcIds.has(obj.npcId) && (
              <img
                src="/media/img/icons/questionmark.png"
                className="absolute pointer-events-none"
                style={{
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-40%) translateY(-35%)",
                  width: "1.5vw",
                  height: "auto",
                }}
                alt=""
              />
            )}
            {obj.type === "player" && obj.username === currentUsername && (
              <img
                src="/media/img/icons/playerIndicator.png"
                className="absolute pointer-events-none"
                style={{
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%) translateY(-140%)",
                  width: "1.5vw",
                  height: "auto",
                }}
                alt=""
              />
            )}
          </div>
        );
      })}
    </section>
  );
};
