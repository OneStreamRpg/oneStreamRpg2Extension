import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGameObjects } from "../../hooks/useGameobjects";
import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { logger } from "../../services/Logger";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useSyncBarStore } from "../../store/useSyncBarStore";
import { PathOverlay } from "../PathOverlay";
import { PanelEntityCircle } from "./PanelEntityCircle";

const TAG = "PanelMapView";
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
        bottom: "110%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "200%",
        minWidth: "40px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#e8d08a",
          fontSize: "8px",
          fontWeight: "bold",
          marginBottom: "1px",
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
          height: "3px",
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

export const PanelMapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
  const { movePlayer, setTargetEnemy } = usePersonalChannelActions(socket);
  const { setTargetNpc } = useNpcActions(socket);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const bounds = container.getBoundingClientRect();
      const rawX = e.clientX - bounds.left;
      const rawY = e.clientY - bounds.top;
      const scaleX = 1920 / bounds.width;
      const scaleY = 1080 / bounds.height;
      const scaledX = rawX * scaleX;
      const scaledY = rawY * scaleY;

      logger.debug(
        TAG,
        `Player move requested: x=${Math.round(scaledX)}, y=${Math.round(scaledY)}`
      );
      movePlayer(scaledX, scaledY);
    },
    [movePlayer]
  );

  return (
    <div className="w-full overflow-auto">
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full cursor-pointer"
        style={{
          aspectRatio: "1920 / 1080",
          backgroundImage: "url(https://cdn.onestreamrpg.com/images/map.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <PathOverlay />

        {gameObjects.map((obj) => {
          const isMe = obj.type === "player" && obj.username === myUsername;
          const hasQuest = obj.type === "npc" && questNpcIds.has(obj.npcId);

          return (
            <PanelEntityCircle
              key={obj.id}
              obj={obj}
              isMe={isMe}
              hasQuest={hasQuest}
              onClickEnemy={setTargetEnemy}
              onClickNpc={setTargetNpc}
              syncBar={isMe ? <PlayerSyncBar /> : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};
