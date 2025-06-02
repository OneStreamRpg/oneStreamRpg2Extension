import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { useSocketStore } from "../store/socketStore";
import Inventory from "../components/inventory/Inventory";
import ClickMarker from "../components/ui/ClickMarker";
import GameObjectTooltip from "../components/ui/GameObjectTooltip";
import { handleClick as externalClickHandler } from "../utils/handleClick";
import { useGameObjects } from "../hooks/useGameObjects";

const ConnectedOverlay = () => {
  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);
  const gameState = useSocketStore((state) => state.gameState); // assume this is kept up-to-date
  
  console.log("Game state in overlay:", gameState);
  const gameObjects = useGameObjects(gameState);


  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<{ name: string; x: number; y: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: MouseEvent) =>
    externalClickHandler(e, socket, isConnected, setMarker, timeoutRef);

  const handleMouseMove = (e: MouseEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    const bounds = container.getBoundingClientRect();

    // Mouse position within iframe (actual pixels)
    const rawX = e.clientX - bounds.left;
    const rawY = e.clientY - bounds.top;

    // Scale to 1920x1080 virtual space
    const scaleX = 1920 / bounds.width;
    const scaleY = 1080 / bounds.height;

    const mouseX = rawX * scaleX;
    const mouseY = rawY * scaleY;


    const hoveredObject = gameObjects.find((obj) => {
      const { hitbox } = obj;
      return (
        mouseX >= hitbox.x &&
        mouseX <= hitbox.x + hitbox.width &&
        mouseY >= hitbox.y &&
        mouseY <= hitbox.y + hitbox.height
      );
    });

    if (hoveredObject) {
      setHovered({ name: hoveredObject.name, x: rawX, y: rawY }); // use rawX/Y for tooltip position
      container.style.cursor = "pointer";
    } else {
      setHovered(null);
      container.style.cursor = "default";
      console.log(mouseX, mouseY);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isConnected) return <div>Connecting socket...</div>;

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{ position: "relative", padding: 20, height: "100vh" }}
    >
      <h2>Overlay</h2>
      <Inventory />
      {marker && <ClickMarker x={marker.x} y={marker.y} />}
      {hovered && <GameObjectTooltip name={hovered.name} x={hovered.x} y={hovered.y} />}
    </div>
  );
};

export default ConnectedOverlay;
