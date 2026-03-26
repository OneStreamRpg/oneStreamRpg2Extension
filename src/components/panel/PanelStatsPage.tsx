import { useAuthStore } from "../../hooks/useAuthStore";
import { metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { WindowContainer } from "../ui/WindowContainer";

const STAT_ICONS = ["armor", "haste", "healing", "magic", "strength"] as const;

export const PanelStatsPage: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();
  const { profile } = useAuthStore();

  if (!displayedState || !profile) {
    return <div className="p-4" style={{ color: "#9a7850" }}>Loading...</div>;
  }

  const { stats } = displayedState;
  const playerName = displayedState.profile.username;
  const requiredXp = metadataService.getXpForNextLevelSync(stats.level) ?? -1;
  const currentLevelRequiredXp = metadataService.getXpRequirementsSync()![stats.level];
  const currentLevelXp = stats.xp - currentLevelRequiredXp;
  const xpPercentage = requiredXp > 0 ? (currentLevelXp / requiredXp) * 100 : 0;
  const hpPercentage = stats.maxHp > 0 ? (stats.hp / stats.maxHp) * 100 : 0;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Profile Header */}
      <WindowContainer className="p-4" style={{ paddingRight: "16px" }}>
        <div className="flex items-center gap-3 mb-4">
          <img
            className="w-14 h-14 border"
            src={profile.profile_image_url}
            alt={`${playerName}'s profile`}
          />
          <div>
            <div className="font-bold">{playerName}</div>
            <div className="text-sm" style={{ color: "#9a7850" }}>
              Level {stats.level}
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mb-2">
          <div className="text-xs mb-1" style={{ color: "#9a7850" }}>HP</div>
          <div className="relative h-5 border" style={{ borderColor: "#3d1a06" }}>
            <div
              className="h-full"
              style={{ width: `${hpPercentage}%`, backgroundColor: "red" }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs">
              {stats.hp} / {stats.maxHp}
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div>
          <div className="text-xs mb-1" style={{ color: "#9a7850" }}>XP</div>
          <div className="relative h-4 border" style={{ borderColor: "#3d1a06" }}>
            <div
              className="h-full"
              style={{ width: `${xpPercentage}%`, backgroundColor: "yellow" }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs">
              {currentLevelXp} / {requiredXp} XP
            </span>
          </div>
        </div>
      </WindowContainer>

      {/* Stats */}
      <WindowContainer className="p-4" style={{ paddingRight: "16px" }}>
        <div className="text-sm font-bold mb-3" style={{ color: "#c8a020" }}>
          Stats
        </div>
        <div className="flex flex-col gap-2">
          {STAT_ICONS.map((stat) => (
            <div key={stat} className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}media/img/icons/stats/${stat}.png`}
                width={20}
                height={20}
                alt={stat}
              />
              <span className="capitalize text-sm">{stat}</span>
              <span className="ml-auto text-sm" style={{ color: "#c8a020" }}>
                {displayedState.stats[stat] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </WindowContainer>
    </div>
  );
};
