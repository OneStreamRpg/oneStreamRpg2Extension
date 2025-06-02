export interface Hitbox {
    x: number;
    y: number;
    width: number;
    height: number;
    xOffsetRatio: number;
    yOffsetRatio: number;
  }
  
  export interface GameEntityBase {
    id: string;
    name: string;
    hitbox: Hitbox;
    type: "player" | "enemy" | "npc";
  }
  
  export interface Player extends GameEntityBase {
    type: "player";
    twitchId: string;
    username: string;
  }
  
  export interface Enemy extends GameEntityBase {
    type: "enemy";
    level: number;
    hp: number;
  }
  
  export interface Npc extends GameEntityBase {
    type: "npc";
  }
  
  export type GameObject = Player | Enemy | Npc;
  
  export interface GameState {
    players: any[]; // original API data
    enemies: any[];
    npcs: any[];
  }
  