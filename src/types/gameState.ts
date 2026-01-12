export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  xOffsetRatio: number;
  yOffsetRatio: number;
}

export interface BaseEntity {
  id: string;
  hitbox: Hitbox;
  level: number;
  hp: number;
  maxHp: number;
}

export interface Player extends BaseEntity {
  username: string;
  type: "player";
}

export interface Enemy extends BaseEntity {
  enemyId: string;
  name: string;
  type: "enemy";
}

export interface NPC extends BaseEntity {
  npcId: string;
  name: string;
  type: "npc";
}

export type GameObject = Player | Enemy | NPC;

export interface GameState {
  players: any[]; // original API data
  enemies: any[];
  npcs: any[];
}
