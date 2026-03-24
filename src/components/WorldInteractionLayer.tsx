import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameObjects } from "../hooks/useGameobjects";
import { useNpcActions } from "../hooks/useNpcActions";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { useCastBarStore } from "../store/useCastBarStore";
import { PathOverlay } from "./PathOverlay";

const TAG = "WorldInteraction";
const DEBUG = import.meta.env.VITE_DEBUG_WORLD_INTERACTION === "true";
const EMPTY_QUESTS: { npcId: string }[] = [];

const PlayerCastBar: React.FC = () => {
  const cast = useCastBarStore((state) => state.cast);
  const clearCast = useCastBarStore((state) => state.clearCast);

  useEffect(() => {
    if (!cast) return;
    const timer = setTimeout(() => clearCast(), cast.castTimeMs);
    return () => clearTimeout(timer);
  }, [cast, clearCast]);

  if (!cast) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: "190%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "140%",
        minWidth: "60px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#e8d08a",
          fontSize: "0.6vw",
          fontWeight: "bold",
          marginBottom: "2px",
          textShadow: "0 1px 2px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
      >
        {cast.abilityName}
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          borderRadius: "2px",
          height: "4px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #c8a020, #f0d060)",
            animationName: "castBarFill",
            animationDuration: `${cast.castTimeMs}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
            width: "0%",
          }}
        />
      </div>
    </div>
  );
};

export const WorldInteractionLayer: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const socket = useSocketStore((state) => state.socket);
  const gameState = useSocketStore((state) => state.gameState);
  const gameObjects = useGameObjects(gameState);
  const availableQuests = usePersonalChannelStore(
    (state) => state.displayedState?.quests?.available ?? EMPTY_QUESTS
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
      <PathOverlay />

      {gameObjects.map((obj) => {
        let metadata = null;
        let displayName: string | null = null;
        if (obj.type === "npc") {
          const npc = metadataService.getNpcSync(obj.npcId);
          displayName = npc?.name ?? null;
          metadata = `${npc ? npc.name + " (NPC)" : "Unknown NPC, npcId is: " + obj.npcId
            }`;
        } else if (obj.type === "enemy") {
          const enemy = metadataService.getEnemySync(obj.enemyId);
          displayName = enemy?.name ?? null;
          metadata = `${enemy
            ? enemy.name + " (Enemy)"
            : "Unknown Enemy, enemyId is: " + obj.enemyId
            }`;
        }

        const isHovered = hoveredId === obj.id;
        const showTooltip = isHovered && displayName && obj.type !== "player";

        return (
          <div
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
            onMouseEnter={() => obj.type !== "player" && setHoveredId(obj.id)}
            onMouseLeave={() => setHoveredId(null)}
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
            {obj.type === "player" && <PlayerCastBar />}
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
            {showTooltip && (
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: "4px",
                  whiteSpace: "nowrap",
                  background: "rgba(0,0,0,0.75)",
                  color: obj.type === "npc" ? "#c8a020" : "#e05050",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  zIndex: 1000,
                }}
              >
                {displayName}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
