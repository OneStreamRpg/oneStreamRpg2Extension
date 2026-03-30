import { useState } from "react";
import { useAuthStore } from "../hooks/useAuthStore";
import { metadataService } from "../services/MetadataService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useUIStore } from "../store/useUIStore";
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

// MC: I require for the first fetch maxHp and requiredXp or maxXpLevel

export const ProfileNav: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();
  const { profile } = useAuthStore();
  const toggleProfile = useUIStore((state) => state.toggleProfile);
  const [statsOpen, setStatsOpen] = useState(false);

  if (!displayedState || !profile) {
    return <div>Loading...</div>;
  }

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
    <div className="flex items-center">
      <WindowContainer className="pointer-events-auto">
        <div className="flex items-center gap-2 pr-2 text-xs">
          <div className="flex items-center gap-2">
            <img
              className="w-12 h-12 border flex items-center justify-center cursor-pointer"
              src={profile.profile_image_url}
              alt={`${playerProfile.name}'s profile`}
              onClick={toggleProfile}
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
      >
        {statsOpen ? "‹" : "›"}
      </button>

      <div
          style={{
            maxWidth: statsOpen ? "200px" : "0px",
            opacity: statsOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-width 0.25s ease, opacity 0.2s ease",
          }}
        >
          <WindowContainer className="pointer-events-auto">
            <div className="flex flex-col gap-1 px-2 text-xs" style={{ whiteSpace: "nowrap" }}>
              {STAT_ICONS.map((stat) => (
                <div key={stat} className="flex items-center gap-2">
                  <img
                    src={`${import.meta.env.BASE_URL}media/img/icons/stats/${stat}.png`}
                    width={16}
                    height={16}
                    alt={stat}
                  />
                  <span className="capitalize">{stat}</span>
                  <span className="ml-auto pl-4" style={{ color: "#c8a020" }}>
                    {displayedState.stats[stat] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </WindowContainer>
        </div>
    </div>
  );
};
