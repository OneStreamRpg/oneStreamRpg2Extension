export enum WindowId {
  Profile = "profile",
  Quests = "quests",
  Group = "group",
  Trade = "trade",
  // The nav pages each get their own id: only one is ever open, but a viewer
  // who parks the inventory somewhere doesn't expect settings to follow it.
  Inventory = "inventory",
  SkillTree = "skillTree",
  Abilities = "abilities",
  Talents = "talents",
  Recipes = "recipes",
  Settings = "settings",
}

export const ALL_WINDOW_IDS: WindowId[] = [
  WindowId.Profile,
  WindowId.Quests,
  WindowId.Group,
  WindowId.Trade,
  WindowId.Inventory,
  WindowId.SkillTree,
  WindowId.Abilities,
  WindowId.Talents,
  WindowId.Recipes,
  WindowId.Settings,
];

/**
 * Where a window sits before the viewer has ever dragged it.
 *
 * `ax`/`ay` run 0 → 1 across the free space inside the window layer, so 0 is
 * flush left/top, 1 is flush right/bottom and 0.5 is centered. Expressing it
 * this way means the default works at any overlay size without us knowing the
 * window's pixel height up front.
 *
 * Top-left is deliberately left empty: that is where spawn village sits on the
 * stream, and covering it hides the part of the world people look at most.
 */
export type WindowAnchor = { ax: number; ay: number };

export const WINDOW_DEFAULT_ANCHORS: Record<WindowId, WindowAnchor> = {
  [WindowId.Profile]: { ax: 0, ay: 1 },
  [WindowId.Quests]: { ax: 1, ay: 1 },
  [WindowId.Group]: { ax: 0, ay: 0.5 },
  [WindowId.Trade]: { ax: 1, ay: 0.5 },
  [WindowId.Inventory]: { ax: 1, ay: 0 },
  [WindowId.SkillTree]: { ax: 1, ay: 0 },
  [WindowId.Abilities]: { ax: 1, ay: 0 },
  [WindowId.Talents]: { ax: 1, ay: 0 },
  [WindowId.Recipes]: { ax: 1, ay: 0 },
  [WindowId.Settings]: { ax: 1, ay: 0 },
};

export const WINDOW_TITLES: Record<WindowId, string> = {
  [WindowId.Profile]: "Profile",
  [WindowId.Quests]: "Quests",
  [WindowId.Group]: "Group",
  [WindowId.Trade]: "Trade",
  [WindowId.Inventory]: "Inventory",
  [WindowId.SkillTree]: "Skill Tree",
  [WindowId.Abilities]: "Abilities",
  [WindowId.Talents]: "Talents",
  [WindowId.Recipes]: "Recipes",
  [WindowId.Settings]: "Settings",
};

/** Gap kept between a window and the edge of the window layer. */
export const WINDOW_EDGE_INSET = 4;
