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

export interface Enemy extends BaseEntity {
  enemyId: string;
  name: string;
  type: "enemy";
}

export interface NPC extends BaseEntity {
  npcId: string;
  name: string;
  type: "npc";
  upgradeLevel?: number;
}

export type JobSpaceType = "Lumber" | "Miner" | "Fisher";

export interface JobSpace {
  id: string;
  hitbox: Hitbox;
  jobSpaceType: JobSpaceType;
  type: "jobSpace";
}

export type GameObject = Enemy | NPC | JobSpace;

export interface GameState {
  enemies: any[];
  npcs: any[];
  jobSpaces: any[];
}
