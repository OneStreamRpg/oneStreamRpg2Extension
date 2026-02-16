import { MouseEvent, useEffect, useRef, useState } from "react";
import ClickMarker from "../components/ui/ClickMarker";
import { useGameObjects } from "../hooks/useGameobjects";
import { usePersonalChannelDebug } from "../hooks/usePersonalChannelDebug";
import { logger } from "../services/Logger";
import { useSocketStore } from "../store/socketStore";
import { handleClick as externalClickHandler } from "../utils/handleClick";

const TAG = "ConnectedOverlay";

const ConnectedOverlay = () => {
  // Enable debug tools in development
  usePersonalChannelDebug();
  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);
  const gameState = useSocketStore((state) => state.gameState);

  const gameObjects = useGameObjects(gameState);

  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null!);

  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width > 1 && height > 1) {
          setContainerSize({ width, height });
          logger.debug(TAG, "Container size updated", { width, height });
        } else {
          logger.warn(TAG, "Container size too small or not ready yet");
        }
      } else {
        logger.warn(TAG, "containerRef.current is null");
      }
    };

    const observer = new ResizeObserver(() => updateSize());

    const interval = setInterval(() => {
      if (containerRef.current) {
        updateSize();
        observer.observe(containerRef.current);
        clearInterval(interval);
      }
    }, 50); // Wait until it's mounted

    return () => {
      clearInterval(interval);
      if (containerRef.current) observer.unobserve(containerRef.current);
      observer.disconnect();
    };
  }, []);

  const setTargetEnemy = (enemyId: string) => {
    socket?.emit("setTargetEnemy", { enemyId });
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const bounds = container.getBoundingClientRect();

    const rawX = e.clientX - bounds.left;
    const rawY = e.clientY - bounds.top;

    const scaleX = 1920 / bounds.width;
    const scaleY = 1080 / bounds.height;

    const mouseX = rawX * scaleX;
    const mouseY = rawY * scaleY;

    const clickedObject = gameObjects.find((obj) => {
      const hitbox = obj.hitbox;
      const xOffsetRatio = hitbox.xOffsetRatio ?? 0;
      const yOffsetRatio = hitbox.yOffsetRatio ?? 0;

      const hitboxX = hitbox.x - hitbox.width * xOffsetRatio;
      const hitboxY = hitbox.y - hitbox.height * yOffsetRatio;

      return (
        mouseX >= hitboxX &&
        mouseX <= hitboxX + hitbox.width &&
        mouseY >= hitboxY &&
        mouseY <= hitboxY + hitbox.height
      );
    });

    if (
      clickedObject &&
      "type" in clickedObject &&
      clickedObject.type === "enemy" &&
      clickedObject.id
    ) {
      setTargetEnemy(clickedObject.id);
    } else {
      externalClickHandler(
        e,
        socket,
        isConnected,
        setMarker,
        timeoutRef,
        containerRef
      );
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isConnected)
    return (
      <div className="text-red-800 animate-pulse ">Connecting socket...</div>
    );

  const scaleX = containerSize.width / 1920;
  const scaleY = containerSize.height / 1080;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ position: "absolute", height: "100%", width: "100%" }}
    >
      <h2>Overlay2</h2>

      <div style={{ width: 128, height: 150 }}>
        <p style={{ margin: 0 }}>👾 Welcome, Hero!</p>
      </div>

      {marker && <ClickMarker x={marker.x} y={marker.y} />}

      {gameObjects.map((obj, index) => {
        const hitbox = obj.hitbox;
        const xOffsetRatio = hitbox.xOffsetRatio ?? 0;
        const yOffsetRatio = hitbox.yOffsetRatio ?? 0;

        const hitboxX = hitbox.x - hitbox.width * xOffsetRatio;
        const hitboxY = hitbox.y - hitbox.height * yOffsetRatio;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: hitboxX * scaleX,
              top: hitboxY * scaleY,
              width: hitbox.width * scaleX,
              height: hitbox.height * scaleY,
              border: "2px dashed red",
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              pointerEvents: "none",
              zIndex: 1000,
              fontSize: 8,
              color: "red",
            }}
            title={JSON.stringify(obj)}
          >
            <span>{`${Math.round(hitboxX)},${Math.round(hitboxY)}`}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ConnectedOverlay;
