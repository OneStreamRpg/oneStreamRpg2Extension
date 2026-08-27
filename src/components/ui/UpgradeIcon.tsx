import { useEffect, useState } from "react";
import { logger } from "../../services/Logger";
import { resolveUpgradeIcon, upgradeIconSrc, UpgradeIconName } from "../../utils/upgradeIcon";

type UpgradeIconProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** The server's `icon` for this talent/track — a bare art name, no path. */
  icon: string | undefined | null;
  /** Art to show when `icon` is missing or unknown. Pass null to render nothing. */
  fallback?: UpgradeIconName | null;
  /** Only for the warning, so an unknown icon can be traced back to an entry. */
  label?: string;
  size?: number;
};

/** Each unknown icon is reported once, not on every re-render. */
const reported = new Set<string>();

/**
 * A talent / town-upgrade icon. The server names the art explicitly, so this is
 * a lookup; anything this build has no PNG for lands on `fallback`, and a file
 * that fails to load degrades to an empty slot of the same size so rows never
 * reflow.
 */
export const UpgradeIcon: React.FC<UpgradeIconProps> = ({
  icon,
  fallback = "talents",
  label,
  size = 24,
  alt,
  style,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUpgradeIcon(icon);

  // Nothing breaks when the server names art this build doesn't have — the
  // entry quietly wears the fallback. The dev-only warning is how that surfaces,
  // so a new talent or track can be spotted and given a PNG.
  useEffect(() => {
    if (resolved) return;
    const key = `${icon ?? "(none)"}:${label ?? ""}`;
    if (reported.has(key)) return;
    reported.add(key);
    logger.warn(
      "UpgradeIcon",
      `No art for icon "${icon ?? "(none)"}"${label ? ` on "${label}"` : ""} — using ${fallback}`
    );
  }, [resolved, icon, label, fallback]);

  const art = resolved ?? fallback;

  if (!art || failed) {
    // Hold the space so the row lines up with its neighbours.
    return <span style={{ width: size, height: size, flexShrink: 0 }} aria-hidden="true" />;
  }

  return (
    <img
      src={upgradeIconSrc(art)}
      width={size}
      height={size}
      alt={alt ?? label ?? art}
      onError={() => setFailed(true)}
      style={{ imageRendering: "pixelated", flexShrink: 0, ...style }}
      {...rest}
    />
  );
};
