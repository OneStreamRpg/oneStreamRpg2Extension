import { Enemy, GameObject, GameState, JobSpace, NPC } from "../types/gameState";

export function mapEnemies(enemies: any[]): Enemy[] {
  return enemies.map((e): Enemy => ({
    ...e,
    type: "enemy",
  }));
}

export function mapNpcs(npcs: any[]): NPC[] {
  return npcs.map((npc): NPC => ({
    ...npc,
    type: "npc",
  }));
}

export function mapJobSpaces(jobSpaces: any[]): JobSpace[] {
  return jobSpaces.map((js): JobSpace => ({
    id: js.id,
    hitbox: js.hitbox,
    jobSpaceType: js.type,
    type: "jobSpace",
  }));
}

export function mapGameObjects(gameState: GameState | null | undefined): GameObject[] {
  if (!gameState) return [];
  return [
    ...mapEnemies(gameState.enemies ?? []),
    ...mapNpcs(gameState.npcs ?? []),
    ...mapJobSpaces(gameState.jobSpaces ?? []),
  ];
}
