import { useMemo } from "react";
import { mapGameObjects } from "../services/gameObjects";
import { GameObject } from "../types/gameState";

export function useGameObjects(gameState: any): GameObject[] {
  return useMemo(() => {
    if (!gameState) return [];
    return mapGameObjects(gameState);
  }, [gameState]);
}
