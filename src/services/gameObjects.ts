import { GameObject, Player, Enemy, Npc, GameState } from "../types/gameState";

export function mapPlayers(players: any[]): Player[] {
  console.log("Mapping players:", players);
  return players.map((p): Player => ({
    id: p.playerId,
    name: p.username,
    twitchId: p.twitchId,
    username: p.username,
    type: "player",
    hitbox: p.hitbox,
  }));
}

export function mapEnemies(enemies: any[]): Enemy[] {
  return enemies.map((e): Enemy => ({
    id: e.enemyId,
    name: e.name,
    level: e.level,
    hp: e.hp,
    type: "enemy",
    hitbox: e.hitbox,
  }));
}

export function mapNpcs(npcs: any[]): Npc[] {
  return npcs.map((npc): Npc => ({
    id: npc.npcId,
    name: npc.name,
    type: "npc",
    hitbox: npc.hitbox,
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
export function applyGameStateDelta(objects: GameObject[], delta: Partial<GameState>): GameObject[] {
  // Implement delta merging logic here
  return objects; // For now just return unchanged
}
