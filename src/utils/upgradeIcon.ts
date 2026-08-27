/**
 * Icon lookup for Tower talents and the Guild's town-upgrade tracks.
 *
 * The server sends an explicit `icon` on every talent and track, set per entry
 * and independent of the ids, so this is a direct filename lookup rather than a
 * guess. It is still validated against the art that actually ships: an icon the
 * extension has no PNG for falls back instead of rendering a broken image.
 *
 * Art lives in public/media/img/icons/upgrades/.
 */

export const UPGRADE_ICONS = [
  "attack",
  "efficiency",
  "fishing",
  "health",
  "lumbering",
  "mining",
  "movespeed",
  "talents",
] as const;

export type UpgradeIconName = (typeof UPGRADE_ICONS)[number];

const ICON_SET = new Set<string>(UPGRADE_ICONS);

/**
 * Narrows the server's `icon` to art this build actually has. Returns null for
 * anything unknown or missing — a talent added server-side before its PNG lands
 * here, or an older server that predates the field.
 */
export function resolveUpgradeIcon(icon: string | undefined | null): UpgradeIconName | null {
  if (!icon) return null;
  const name = icon.trim().toLowerCase();
  return ICON_SET.has(name) ? (name as UpgradeIconName) : null;
}

export const upgradeIconSrc = (icon: UpgradeIconName): string =>
  `${import.meta.env.BASE_URL}media/img/icons/upgrades/${icon}.png`;
