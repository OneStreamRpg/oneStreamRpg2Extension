import { useState } from "react";
import { useAuthStore } from "../hooks/useAuthStore";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useLocatePlayerStore } from "../store/useLocatePlayerStore";
import { WindowContainer } from "./ui/WindowContainer";

interface PlayerProfile {
  name: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  hp: number;
  maxHp: number;
}

const STAT_ICONS = ["armor", "haste", "healing", "magic", "strength"] as const;

// Icon (16) + gap (8) + label + gap (8) + value column (36).
const STATS_ROW_WIDTH = 140;
// Row width plus the container's padding (8 + 8) and borders (3 + 3).
const STATS_PANEL_WIDTH = STATS_ROW_WIDTH + 22;

// MC: I require for the first fetch maxHp and requiredXp or maxXpLevel

export const ProfileNav: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();
  const { profile } = useAuthStore();
  const locatePlayer = useLocatePlayerStore((state) => state.ping);
  const [statsOpen, setStatsOpen] = useState(false);

  // Only the avatar comes from Twitch, and it needs a shared ID we may never
  // get. Everything else comes from the game state, so don't hold the whole
  // widget hostage to it — fall back to a placeholder portrait instead.
  if (!displayedState) {
    return <div>Loading...</div>;
  }

  const fallbackAvatar = `${import.meta.env.BASE_URL}media/img/icons/questionmark.png`;
  // `||`, not `??`: Twitch sends an empty string for accounts with no avatar,
  // which would otherwise render as a broken image.
  const avatarUrl = profile?.profile_image_url || fallbackAvatar;

  const playerProfile: PlayerProfile = {
    name: displayedState.profile.username,
    level: displayedState.stats.level,
    currentXp: displayedState.stats.xp,
    requiredXp:
      metadataService.getXpForNextLevelSync(displayedState.stats.level) ?? -1,
    hp: displayedState.stats.hp,
    maxHp: displayedState.stats.maxHp,
  };

  const currentLevelRequiredXp =
    metadataService.getXpRequirementsSync()![playerProfile.level];
  const currentLevelXp = playerProfile.currentXp - currentLevelRequiredXp;
  const xpPercentage = (currentLevelXp / playerProfile.requiredXp) * 100;
  const hpPercentage = (playerProfile.hp / playerProfile.maxHp) * 100;

  return (
    // The stats flyout hangs outside the flow so it can't widen the window —
    // the draggable title bar sizes itself to this element.
    <div className="relative">
      <WindowContainer className="pointer-events-auto">
        <div className="flex items-center gap-2 pr-2 text-xs">
          <div className="flex items-center gap-2">
            <img
              className="w-12 h-12 border flex items-center justify-center cursor-pointer"
              src={avatarUrl}
              alt={`${playerProfile.name}'s profile`}
              onError={(e) => {
                e.currentTarget.src = fallbackAvatar;
              }}
              onClick={locatePlayer}
              title="Show me on stream"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span>{playerProfile.name}</span>
                <span>Lvl {playerProfile.level}</span>
              </div>

              <div className="relative">
                <div className="h-4 border">
                  <div
                    className="h-full"
                    style={{
                      width: `${hpPercentage}%`,
                      backgroundColor: "red",
                    }}
                  />
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {playerProfile.hp} / {playerProfile.maxHp}
                </span>
              </div>

              <div className="relative">
                <div className="h-3 border">
                  <div
                    className="h-full"
                    style={{
                      width: `${xpPercentage}%`,
                      backgroundColor: "yellow",
                    }}
                  />
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {playerProfile.currentXp} / {playerProfile.requiredXp} XP
                </span>
              </div>

              {displayedState.currency && (
                <div className="flex items-center gap-3">
                  <img
                    src={`${import.meta.env.BASE_URL}media/img/icons/gold.png`}
                    width={14}
                    height={14}
                    alt="gold"
                  />
                  <span style={{ color: "#c8a020" }}>{displayedState.currency.gold ?? 0}</span>
                  <img
                    src={`${import.meta.env.BASE_URL}media/img/icons/gem.png`}
                    width={14}
                    height={14}
                    alt="gems"
                  />
                  <span style={{ color: "#c8a020" }}>{displayedState.currency.gems ?? 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </WindowContainer>

      <div className="absolute left-full top-0 h-full flex items-center">
        <button
          onClick={() => setStatsOpen((o) => !o)}
          className="pointer-events-auto cursor-pointer"
          style={{
            color: "#c8a020",
            background: "rgba(0,0,0,0.7)",
            border: "3px solid #9a7228",
            borderLeft: "none",
            padding: "4px 6px",
            fontSize: "14px",
            lineHeight: 1,
          }}
          title={statsOpen ? "Hide stats" : "Show stats"}
        >
          {statsOpen ? "‹" : "›"}
        </button>

        <div
          style={{
            maxWidth: statsOpen ? `${STATS_PANEL_WIDTH}px` : "0px",
            opacity: statsOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-width 0.25s ease, opacity 0.2s ease",
          }}
        >
          <WindowContainer
            className="pointer-events-auto"
            style={{ paddingRight: "8px" }}
          >
            {/* Fixed width rather than content-sized: it keeps every value in
                the same column, stops the longest row from spilling past the
                frame, and means the reveal doesn't reflow as it opens. */}
            <div
              className="flex flex-col gap-1 text-xs"
              style={{ width: STATS_ROW_WIDTH }}
            >
              {STAT_ICONS.map((stat) => (
                <div key={stat} className="flex items-center gap-2">
                  <img
                    className="shrink-0"
                    src={`${import.meta.env.BASE_URL}media/img/icons/stats/${stat}.png`}
                    width={16}
                    height={16}
                    // Decorative: the label beside it already names the stat,
                    // and empty alt keeps the row aligned if it fails to load.
                    alt=""
                  />
                  <span className="capitalize truncate">{stat}</span>
                  <span
                    className="ml-auto shrink-0 text-right tabular-nums"
                    style={{ color: "#c8a020", minWidth: 36 }}
                  >
                    {displayedState.stats[stat] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </WindowContainer>
        </div>
      </div>
    </div>
  );
};
