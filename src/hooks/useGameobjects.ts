import { useMemo } from "react";
import { GameObject } from "../types/gameState";
import { mapGameObjects } from "../services/gameObjects";

export function useGameObjects(gameState: any): GameObject[] {
  return useMemo(() => {
    if (!gameState) return [];
    return mapGameObjects(gameState);
  }, [gameState]);
}
