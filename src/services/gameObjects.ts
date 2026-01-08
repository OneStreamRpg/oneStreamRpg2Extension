import { Enemy, GameObject, GameState, Npc, Player } from "../types/gameState";

export function mapPlayers(players: any[]): Player[] {
  return players.map((p): Player => ({
    ...p,
    type: "player",
  }));
}

export function mapEnemies(enemies: any[]): Enemy[] {
  return enemies.map((e): Enemy => ({
    ...e,
    type: "enemy",
  }));
}

export function mapNpcs(npcs: any[]): Npc[] {
  return npcs.map((npc): Npc => ({
    ...npc,
    type: "npc",
  }));
}

export function mapGameObjects(gameState: GameState | null | undefined): GameObject[] {
  if (!gameState) return [];
  return [
    ...mapPlayers(gameState.players),
    ...mapEnemies(gameState.enemies),
    ...mapNpcs(gameState.npcs),
  ];
}

// For future delta updates
export function applyGameStateDelta(objects: GameObject[]): GameObject[] {
  // Implement delta merging logic here
  return objects; // For now just return unchanged
}
