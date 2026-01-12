import { Tooltip } from "react-tooltip";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { WindowContainer } from "./ui/WindowContainer";

interface PlayerProfile {
  name: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
}

// MC: I require for the first fetch maxHp, maxMana and requiredXp or maxXpLevel

export const ProfileNav: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();

  if (!displayedState) {
    return <div>Loading...</div>;
  }

  const playerProfile: PlayerProfile = {
    name: "MISSING",
    level: displayedState.stats.level,
    currentXp: displayedState.stats.xp,
    requiredXp: 10000,
    hp: displayedState.stats.hp,
    maxHp: displayedState.stats.maxHp,
    mana: displayedState.stats.mana,
    maxMana: displayedState.stats.maxMana,
  };

  // Mock full stats - to be fetched from backend on hover
  const fullStats = displayedState.stats;

  const xpPercentage =
    (playerProfile.currentXp / playerProfile.requiredXp) * 100;
  const hpPercentage = (playerProfile.hp / playerProfile.maxHp) * 100;
  const manaPercentage = (playerProfile.mana / playerProfile.maxMana) * 100;

  return (
    <>
      <WindowContainer className="pointer-events-auto">
        <div className="flex items-center gap-2 p-2 bg-red-500/20 text-xs">
          <div
            className="flex items-center gap-2"
            data-tooltip-id="player-stats-tooltip"
          >
            <div className="w-12 h-12 border flex items-center justify-center">
              <span>👤</span>
            </div>

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
                <div className="h-4 border">
                  <div
                    className="h-full"
                    style={{
                      width: `${manaPercentage}%`,
                      backgroundColor: "blue",
                    }}
                  />
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {playerProfile.mana} / {playerProfile.maxMana}
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
            </div>
          </div>
        </div>
      </WindowContainer>

      <Tooltip
        id="player-stats-tooltip"
        place="bottom"
        clickable
        delayShow={200}
      >
        <div className="p-4">
          <h3>Character Stats</h3>

          <div className="mt-2">
            {Object.entries(fullStats).map(([statName, statValue]) => (
              <div className="flex justify-between" key={statName}>
                <span>
                  {statName.charAt(0).toUpperCase() + statName.slice(1)}:
                </span>
                <span>{statValue}</span>
              </div>
            ))}
          </div>
        </div>
      </Tooltip>
    </>
  );
};
