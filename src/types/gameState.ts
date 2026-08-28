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
  /**
   * Level-independent blurb saying what the building is for ("Mine stone here.
   * Each level adds another stone deposit."). Static per NPC, so it rides along
   * with the game state and needs no round-trip on hover. Not the same as the
   * upgrade description, which previews what the NEXT level gives.
   *
   * Every definition should carry one; treat a gap as a definition that hasn't
   * been given a blurb yet rather than a normal state.
   */
  description?: string;
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
