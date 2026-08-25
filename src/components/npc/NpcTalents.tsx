import { useNpcActions } from "../../hooks/useNpcActions";
import { useSocketStore } from "../../store/socketStore";
import { TalentInfoData } from "../../types/npcInteraction";
import { TalentList } from "../talents/TalentList";

/**
 * The Tower's talent panel. Only reachable while standing at the Tower, so
 * spending and the full respec are both always available here — unlike the
 * standalone Talents window, which is view-only away from the building.
 */
export const NpcTalents: React.FC<{ data: TalentInfoData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { spendTalent, resetTalents } = useNpcActions(socket);

  return (
    <div className="flex flex-col gap-3 min-w-72 max-w-80 p-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-center">Talents</h2>
        <p className="text-xs text-center text-gray-400">
          Level {data.level}/{data.maxLevel} — one point per level.
        </p>
        <p
          className="text-sm text-center font-bold"
          style={{ color: data.talentPoints > 0 ? "#f0d060" : "#888" }}
        >
          {data.talentPoints} unspent point{data.talentPoints === 1 ? "" : "s"}
        </p>
      </div>

      <TalentList
        talents={data.talents}
        points={data.talentPoints}
        canSpend
        onSpend={(talentId) => spendTalent(data.npcId, talentId)}
      />

      <button
        onClick={() => resetTalents(data.npcId)}
        className="px-3 py-1 text-xs cursor-pointer self-center"
        style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
        title="Refunds every spent point"
      >
        Reset all talents
      </button>
    </div>
  );
};
