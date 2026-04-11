import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameObjects } from "../hooks/useGameobjects";
import { useNpcActions } from "../hooks/useNpcActions";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useAimStore } from "../store/useAimStore";
import { useSocketStore } from "../store/socketStore";
import { useSyncBarStore } from "../store/useSyncBarStore";
import { useCastIndicatorStore } from "../store/useCastIndicatorStore";
import { PathOverlay } from "./PathOverlay";

const TAG = "WorldInteraction";
const DEBUG = import.meta.env.VITE_DEBUG_WORLD_INTERACTION === "true";
const EMPTY_QUESTS: { npcId: string }[] = [];

const PlayerSyncBar: React.FC = () => {
  const bar = useSyncBarStore((state) => state.bar);
  const hide = useSyncBarStore((state) => state.hide);

  useEffect(() => {
    if (!bar) return;
    const timer = setTimeout(() => hide(), bar.durationMs);
    return () => clearTimeout(timer);
  }, [bar, hide]);

  if (!bar) return null;

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
        {bar.label}
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
            animationDuration: `${bar.durationMs}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
            width: "0%",
          }}
        />
      </div>
    </div>
  );
};

import { CastIndicatorEntry } from "../store/useCastIndicatorStore";

const CastIndicatorItem: React.FC<{
  entry: CastIndicatorEntry;
  gameState: any;
  myUsername: string | null;
}> = ({ entry, gameState, myUsername }) => {
  const hide = useCastIndicatorStore((state) => state.hide);

  useEffect(() => {
    const timer = setTimeout(() => hide(entry.id), entry.durationMs);
    return () => clearTimeout(timer);
  }, [entry.id, entry.durationMs, hide]);

  const abilityMeta = metadataService.getAbilitySync(entry.abilityId);
  if (!abilityMeta) return null;

  const { aimX, aimY, durationMs } = entry;
  const leftPct = (aimX / 1920) * 100;
  const topPct = (aimY / 1080) * 100;

  if (abilityMeta.type === "skillshot" || abilityMeta.type === "slash") {
    const playerPos = getPlayerWorldPos(gameState, myUsername);
    const angle = playerPos
      ? Math.atan2(aimX - playerPos.x, -(aimY - playerPos.y))
      : 0;
    const imgName = abilityMeta.type === "slash" ? "slash" : "skillshot";
    return (
      <img
        src={`${import.meta.env.BASE_URL}media/img/indicator/${imgName}.png`}
        alt=""
        className="absolute pointer-events-none cast-indicator-reveal"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: `translate(-50%, -50%) rotate(${angle}rad)`,
          ["--cast-duration" as string]: `${durationMs}ms`,
        }}
      />
    );
  }

  if (abilityMeta.type === "aoeCircle") {
    const effectSize = abilityMeta.effectSize ?? 0;
    const widthPct = (effectSize * 2 / 1920) * 100;
    const heightPct = (effectSize * 2 / 1080) * 100;
    return (
      <img
        src={`${import.meta.env.BASE_URL}media/img/indicator/aoeCircle.png`}
        alt=""
        className="absolute pointer-events-none cast-indicator-reveal"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          transform: `translate(-50%, -50%)`,
          ["--cast-duration" as string]: `${durationMs}ms`,
        }}
      />
    );
  }

  return null;
};

const CastIndicatorOverlay: React.FC<{ gameState: any; myUsername: string | null }> = ({
  gameState,
  myUsername,
}) => {
  const indicators = useCastIndicatorStore((state) => state.indicators);

  return (
    <>
      {indicators.map((entry) => (
        <CastIndicatorItem key={entry.id} entry={entry} gameState={gameState} myUsername={myUsername} />
      ))}
    </>
  );
};

export const WorldInteractionLayer: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);

  const socket = useSocketStore((state) => state.socket);
  const gameState = useSocketStore((state) => state.gameState);
  const gameObjects = useGameObjects(gameState);
  const myUsername = usePersonalChannelStore(
    (state) => state.displayedState?.profile?.username ?? null
  );
  const availableQuests = usePersonalChannelStore(
    (state) => state.displayedState?.quests?.available ?? EMPTY_QUESTS
  );
  const questNpcIds = useMemo(
    () => new Set(availableQuests.map((q) => q.npcId)),
    [availableQuests]
  );
  const { movePlayer, setTargetEnemy, castAbility } = usePersonalChannelActions(socket);
  const { setTargetNpc } = useNpcActions(socket);

  const { isAiming, slotType, abilityType, range, effectSize, stopAim } = useAimStore();

  // Convert client coords to world coords using the section's bounds
  const clientToWorld = useCallback((clientX: number, clientY: number) => {
    const section = sectionRef.current;
    if (!section) return { x: 0, y: 0 };
    const bounds = section.getBoundingClientRect();
    return {
      x: (clientX - bounds.left) * (1920 / bounds.width),
      y: (clientY - bounds.top) * (1080 / bounds.height),
    };
  }, []);

  // Track mouse and handle aim cast via mouseup when aiming
  useEffect(() => {
    if (!isAiming) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!slotType) { stopAim(); return; }

      let { x: aimX, y: aimY } = clientToWorld(e.clientX, e.clientY);

      if (range !== null) {
        const playerPos = getPlayerWorldPos(gameState, myUsername);
        if (playerPos) {
          const dx = aimX - playerPos.x;
          const dy = aimY - playerPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > range) {
            aimX = playerPos.x + (dx / dist) * range;
            aimY = playerPos.y + (dy / dist) * range;
          }
        }
      }

      castAbility(slotType, aimX, aimY);
      stopAim();
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isAiming, slotType, abilityType, range, clientToWorld, castAbility, stopAim, gameState, myUsername]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isAiming) return; // mouseup handler already cast the ability
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
    [movePlayer, isAiming]
  );

  // Compute aim indicator position and properties
  const aimIndicator = useMemo(() => {
    if (!isAiming || !abilityType) return null;
    const section = sectionRef.current;
    if (!section) return null;

    const bounds = section.getBoundingClientRect();
    const mouse = {
      x: (mousePosRef.current.x - bounds.left) * (1920 / bounds.width),
      y: (mousePosRef.current.y - bounds.top) * (1080 / bounds.height),
    };

    if (abilityType === "skillshot" || abilityType === "slash") {
      const playerPos = getPlayerWorldPos(gameState, myUsername);
      let worldX = mouse.x;
      let worldY = mouse.y;
      let angle = 0;
      if (playerPos) {
        const dx = mouse.x - playerPos.x;
        const dy = mouse.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (range !== null && dist > range) {
          worldX = playerPos.x + (dx / dist) * range;
          worldY = playerPos.y + (dy / dist) * range;
        }
        angle = Math.atan2(worldX - playerPos.x, -(worldY - playerPos.y));
      }
      const leftPct = (worldX / 1920) * 100;
      const topPct = (worldY / 1080) * 100;
      return { type: abilityType as "skillshot" | "slash", leftPct, topPct, angle };
    }

    if (abilityType === "aoeCircle") {
      let worldX = mouse.x;
      let worldY = mouse.y;

      if (range !== null) {
        const playerPos = getPlayerWorldPos(gameState, myUsername);
        if (playerPos) {
          const dx = mouse.x - playerPos.x;
          const dy = mouse.y - playerPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > range) {
            worldX = playerPos.x + (dx / dist) * range;
            worldY = playerPos.y + (dy / dist) * range;
          }
        }
      }

      const leftPct = (worldX / 1920) * 100;
      const topPct = (worldY / 1080) * 100;
      const widthPct = effectSize !== null ? (effectSize * 2 / 1920) * 100 : 0;
      const heightPct = effectSize !== null ? (effectSize * 2 / 1080) * 100 : 0;
      return { type: "aoeCircle" as const, leftPct, topPct, widthPct, heightPct };
    }

    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiming, abilityType, mousePos, range, effectSize, gameState, myUsername]);

  return (
    <section
      ref={sectionRef}
      onClick={handleClick}
      className="size-full bg-cover bg-center bg-no-repeat relative"
      style={isAiming ? { cursor: "crosshair" } : {}}
    >
      <PathOverlay />

      {gameObjects.filter((obj) => obj.hitbox).map((obj) => {
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
            {obj.type === "player" && obj.username === myUsername && <PlayerSyncBar />}
            {obj.type === "npc" && questNpcIds.has(obj.npcId) && (
              <img
                src={`${import.meta.env.BASE_URL}media/img/icons/questionmark.png`}
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

      {/* Aim indicators */}
      {aimIndicator?.type === "skillshot" && (
        <img
          src={`${import.meta.env.BASE_URL}media/img/indicator/skillshot.png`}
          alt=""
          className="absolute pointer-events-none"
          style={{
            left: `${aimIndicator.leftPct}%`,
            top: `${aimIndicator.topPct}%`,
            transform: `translate(-50%, -50%) rotate(${aimIndicator.angle}rad)`,
          }}
        />
      )}
      {aimIndicator?.type === "slash" && (
        <img
          src={`${import.meta.env.BASE_URL}media/img/indicator/slash.png`}
          alt=""
          className="absolute pointer-events-none"
          style={{
            left: `${aimIndicator.leftPct}%`,
            top: `${aimIndicator.topPct}%`,
            transform: `translate(-50%, -50%) rotate(${aimIndicator.angle}rad)`,
          }}
        />
      )}
      {aimIndicator?.type === "aoeCircle" && (
        <img
          src={`${import.meta.env.BASE_URL}media/img/indicator/aoeCircle.png`}
          alt=""
          className="absolute pointer-events-none"
          style={{
            left: `${aimIndicator.leftPct}%`,
            top: `${aimIndicator.topPct}%`,
            width: `${aimIndicator.widthPct}%`,
            height: `${aimIndicator.heightPct}%`,
            transform: `translate(-50%, -50%)`,
          }}
        />
      )}
      <CastIndicatorOverlay gameState={gameState} myUsername={myUsername} />
    </section>
  );
};

function getPlayerWorldPos(
  gameState: any,
  myUsername: string | null
): { x: number; y: number } | null {
  if (!gameState || !myUsername) return null;
  const players: any[] = gameState.players ?? [];
  const me = players.find((p) => p.username === myUsername);
  if (!me?.hitbox) return null;
  return { x: me.hitbox.x, y: me.hitbox.y };
}
