import { TalentStatus } from "../../types/npcInteraction";

/**
 * The talent rows themselves, shared by the Tower's popup and the standalone
 * Talents window so the two can never drift apart.
 *
 * `canSpend` is the caller's call: the Tower popup is only reachable in range so
 * it passes true, while the window computes proximity itself and passes false
 * (with a hint) when the player is somewhere else in the world.
 */
export const TalentList: React.FC<{
  talents: TalentStatus[];
  points: number;
  canSpend: boolean;
  onSpend: (talentId: string) => void;
}> = ({ talents, points, canSpend, onSpend }) => (
  <div className="flex flex-col gap-2">
    {talents.map((talent) => {
      const maxed = talent.rank >= talent.maxRank;
      // Capped-by-Tower is not the same as finished: the rank bar still runs to
      // maxRank, with a marker showing where the current Tower level stops.
      const atCap = !maxed && talent.rank >= talent.rankCap;
      const affordable = canSpend && !maxed && !atCap && points > 0;
      const pct = (talent.rank / talent.maxRank) * 100;
      const capPct = (talent.rankCap / talent.maxRank) * 100;

      return (
        <div
          key={talent.talentId}
          className="flex flex-col gap-1 px-2 py-2 rounded"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm font-semibold">{talent.name}</span>
            <span
              className="text-xs font-bold whitespace-nowrap"
              style={{ color: maxed ? "#4a9a4a" : "#f0d8a8" }}
            >
              {talent.rank}/{talent.maxRank}
            </span>
          </div>

          <div
            className="relative"
            style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: "2px",
              height: "4px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: maxed ? "#4a9a4a" : "linear-gradient(90deg, #c8a020, #f0d060)",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
            {/* Where the Tower's current level stops training. */}
            {!maxed && talent.rankCap < talent.maxRank && (
              <div
                className="absolute top-0"
                style={{
                  left: `${capPct}%`,
                  width: "2px",
                  height: "100%",
                  background: "#e07050",
                }}
                title={`Tower trains to rank ${talent.rankCap}`}
              />
            )}
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="flex flex-col">
              <span className="text-xs" style={{ color: "#a0d0ff" }}>
                {talent.effect}
              </span>
              <span className="text-xs text-gray-400">{talent.description}</span>
              {atCap && (
                <span className="text-xs" style={{ color: "#e07050" }}>
                  Upgrade the Tower to pass rank {talent.rankCap}
                </span>
              )}
            </span>
            <button
              onClick={() => onSpend(talent.talentId)}
              disabled={!affordable}
              title={
                maxed
                  ? "Already at max rank"
                  : atCap
                    ? `The Tower only trains to rank ${talent.rankCap} — upgrade it`
                    : !canSpend
                      ? "Spend at the Tower"
                      : points <= 0
                        ? "No talent points"
                        : `Spend 1 point on ${talent.name}`
              }
              className="px-3 py-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
            >
              {maxed ? "Max" : atCap ? "Cap" : "+1"}
            </button>
          </div>
        </div>
      );
    })}
  </div>
);
