import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameObjects } from "../hooks/useGameobjects";
import { useNpcActions } from "../hooks/useNpcActions";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { logger } from "../services/Logger";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { useAimStore } from "../store/useAimStore";
import { useCastIndicatorStore } from "../store/useCastIndicatorStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSyncBarStore } from "../store/useSyncBarStore";
import { useUIStore } from "../store/useUIStore";
import { JobSpaceType } from "../types/gameState";
import { PathOverlay } from "./PathOverlay";

const JOB_SPACE_ICONS: Record<JobSpaceType, string> = {
  Lumber: "tree",
  Miner: "rock",
  Fisher: "pond",
};

const JOB_SPACE_LABELS: Record<JobSpaceType, string> = {
  Lumber: "Chop",
  Miner: "Mine",
  Fisher: "Fish",
};

const WorldToast: React.FC = () => {
  const toast = useUIStore((state) => state.worldToast);
  const setWorldToast = useUIStore((state) => state.setWorldToast);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWorldToast(null);
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.key, toast, setWorldToast]);

  if (!toast || !visible) return null;

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm text-white rounded pointer-events-none z-50 whitespace-nowrap"
      style={toast.isError
        ? { backgroundColor: "#5a1a1a", border: "1px solid #c04040" }
        : { backgroundColor: "#2a5a2a", border: "1px solid #4a9a4a" }}
    >
      {toast.message}
    </div>
  );
};

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
        bottom: "225%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "140%",
        minWidth: "60px",
        marginBottom: "4px",
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

const PlayerAnchor: React.FC = () => {
  const hitbox = usePlayerStore((state) => state.player?.hitbox);
  const processQueue = usePlayerStore((state) => state.processQueue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      processQueue(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [processQueue]);

  if (!hitbox) return null;

  const xOffsetRatio = hitbox.xOffsetRatio ?? 0;
  const yOffsetRatio = hitbox.yOffsetRatio ?? 0;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${((hitbox.x - hitbox.width * xOffsetRatio) / 1920) * 100}%`,
        top: `${((hitbox.y - hitbox.height * yOffsetRatio) / 1080) * 100}%`,
        width: `${(hitbox.width / 1920) * 100}%`,
        height: `${(hitbox.height / 1080) * 100}%`,
      }}
    >
      <PlayerSyncBar />
    </div>
  );
};

import { CastIndicatorEntry } from "../store/useCastIndicatorStore";

const CastIndicatorItem: React.FC<{
  entry: CastIndicatorEntry;
}> = ({ entry }) => {
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
    const playerPos = getPlayerWorldPos();
    const angle = playerPos
      ? Math.atan2(aimX - playerPos.x, -(aimY - playerPos.y))
      : 0;
    const imgName = abilityMeta.type === "slash" ? "slash" : "skillshot";
    const revealClass = abilityMeta.type === "skillshot"
      ? "cast-indicator-reveal-linear"
      : "cast-indicator-reveal";
    return (
      <img
        src={`${import.meta.env.BASE_URL}media/img/indicator/${imgName}.png`}
        alt=""
        className={`absolute pointer-events-none ${revealClass}`}
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

  if (abilityMeta.type === "autoTarget") {
    return (
      <img
        src={`${import.meta.env.BASE_URL}media/img/indicator/autoTarget.png`}
        alt=""
        className="absolute pointer-events-none cast-indicator-reveal"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: `translate(-50%, calc(-50% - 15px))`,
          ["--cast-duration" as string]: `${durationMs}ms`,
        }}
      />
    );
  }

  return null;
};

const CastIndicatorOverlay: React.FC = () => {
  const indicators = useCastIndicatorStore((state) => state.indicators);

  return (
    <>
      {indicators.map((entry) => (
        <CastIndicatorItem key={entry.id} entry={entry} />
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
  const { movePlayer, setTargetEnemy, setTargetJobSpace, castAbility } = usePersonalChannelActions(socket);
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

  // Among all gameObjects whose rendered hitbox contains the cursor, pick the one
  // whose center is closest to the cursor. This prevents the DOM-stacking-order
  // determining which overlapping target gets the hover/click.
  const pickBestObject = useCallback((clientX: number, clientY: number) => {
    const section = sectionRef.current;
    if (!section) return null;
    const bounds = section.getBoundingClientRect();
    const worldX = (clientX - bounds.left) * (1920 / bounds.width);
    const worldY = (clientY - bounds.top) * (1080 / bounds.height);

    // 2vw click target for jobSpaces — convert to world units using the section scale.
    const jsHalfW = (0.02 * window.innerWidth) * (1920 / bounds.width) / 2;
    const jsHalfH = (0.02 * window.innerWidth) * (1080 / bounds.height) / 2;

    let best: typeof gameObjects[number] | null = null;
    let bestDistSq = Infinity;
    for (const obj of gameObjects) {
      if (!obj.hitbox) continue;
      let left: number, top: number, width: number, height: number, cx: number, cy: number;
      if (obj.type === "jobSpace") {
        cx = obj.hitbox.x;
        cy = obj.hitbox.y;
        width = jsHalfW * 2;
        height = jsHalfH * 2;
        left = cx - jsHalfW;
        top = cy - jsHalfH;
      } else {
        const xOff = obj.hitbox.xOffsetRatio ?? 0;
        const yOff = obj.hitbox.yOffsetRatio ?? 0;
        width = obj.hitbox.width;
        height = obj.hitbox.height;
        left = obj.hitbox.x - width * xOff;
        top = obj.hitbox.y - height * yOff;
        cx = left + width / 2;
        cy = top + height / 2;
      }
      if (worldX < left || worldX > left + width || worldY < top || worldY > top + height) continue;
      const dx = worldX - cx;
      const dy = worldY - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = obj;
      }
    }
    return best;
  }, [gameObjects]);

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
        const playerPos = getPlayerWorldPos();
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

      const best = pickBestObject(e.clientX, e.clientY);
      if (best) {
        logger.debug(TAG, `Game object clicked: `, { obj: best });
        if (best.type === "enemy") setTargetEnemy(best.id);
        else if (best.type === "npc") setTargetNpc(best.npcId);
        else if (best.type === "jobSpace") setTargetJobSpace(best.id);
        return;
      }

      const bounds = section.getBoundingClientRect();
      const scaledX = (e.clientX - bounds.left) * (1920 / bounds.width);
      const scaledY = (e.clientY - bounds.top) * (1080 / bounds.height);

      logger.debug(
        TAG,
        `Player move requested: x=${Math.round(scaledX)}, y=${Math.round(scaledY)}`
      );
      movePlayer(scaledX, scaledY);
    },
    [movePlayer, isAiming, pickBestObject, setTargetEnemy, setTargetNpc, setTargetJobSpace]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const best = pickBestObject(e.clientX, e.clientY);
      setHoveredId((prev) => (prev === (best?.id ?? null) ? prev : best?.id ?? null));
    },
    [pickBestObject]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  const hoveredObj = useMemo(
    () => gameObjects.find((o) => o.id === hoveredId) ?? null,
    [gameObjects, hoveredId]
  );
  const sectionCursor = isAiming
    ? "crosshair"
    : hoveredObj?.type === "enemy"
      ? "crosshair"
      : hoveredObj
        ? "pointer"
        : "default";

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
      const playerPos = getPlayerWorldPos();
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
        const playerPos = getPlayerWorldPos();
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

    if (abilityType === "autoTarget") {
      let worldX = mouse.x;
      let worldY = mouse.y;

      if (range !== null) {
        const playerPos = getPlayerWorldPos();
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
      return { type: "autoTarget" as const, leftPct, topPct };
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiming, abilityType, mousePos, range, effectSize, gameState, myUsername]);

  return (
    <section
      ref={sectionRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="size-full bg-cover bg-center bg-no-repeat relative"
      style={{ cursor: sectionCursor }}
    >
      <PathOverlay />

      {gameObjects.filter((obj) => obj.hitbox).map((obj) => {
        let displayName: string | null = null;
        if (obj.type === "npc") {
          const npc = metadataService.getNpcSync(obj.npcId);
          displayName = npc?.name ?? null;
        } else if (obj.type === "enemy") {
          const enemy = metadataService.getEnemySync(obj.enemyId);
          displayName = enemy?.name ?? null;
        } else if (obj.type === "jobSpace") {
          displayName = JOB_SPACE_LABELS[obj.jobSpaceType] ?? obj.jobSpaceType;
        }

        const isHovered = hoveredId === obj.id;
        const showTooltip = isHovered && displayName;

        return (
          <div
            key={obj.id}
            className={`absolute pointer-events-none ${DEBUG ? "border border-white/30" : ""} ${!obj.id ? "bg-red-500" : ""}`}
            style={obj.type === "jobSpace" ? {
              left: `${(obj.hitbox.x / 1920) * 100}%`,
              top: `${(obj.hitbox.y / 1080) * 100}%`,
              width: "2vw",
              height: "2vw",
              transform: "translate(-50%, -50%)",
              zIndex: 5,
            } : {
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
            {obj.type === "jobSpace" && (
              <img
                src={`${import.meta.env.BASE_URL}media/img/icons/${JOB_SPACE_ICONS[obj.jobSpaceType]}.png`}
                className="absolute pointer-events-none"
                style={{
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%) translateY(-10%)",
                  width: "1.8vw",
                  height: "auto",
                }}
                alt=""
              />
            )}
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
                  color: obj.type === "npc" ? "#c8a020" : obj.type === "jobSpace" ? "#78dc78" : "#e05050",
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
      {aimIndicator?.type === "autoTarget" && (
        <img
          src={`${import.meta.env.BASE_URL}media/img/indicator/autoTarget.png`}
          alt=""
          className="absolute pointer-events-none"
          style={{
            left: `${aimIndicator.leftPct}%`,
            top: `${aimIndicator.topPct}%`,
            transform: `translate(-50%, calc(-50% - 20px))`,
          }}
        />
      )}
      <CastIndicatorOverlay />
      <PlayerAnchor />
      <WorldToast />
    </section>
  );
};

function getPlayerWorldPos(): { x: number; y: number } | null {
  const hitbox = usePlayerStore.getState().player?.hitbox;
  if (!hitbox) return null;
  return { x: hitbox.x, y: hitbox.y };
}
