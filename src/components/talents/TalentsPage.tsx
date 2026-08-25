import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { TalentList } from "./TalentList";

const TOWER_NPC_ID = "tower";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  xOffsetRatio?: number;
  yOffsetRatio?: number;
};

/**
 * Mirrors HitboxRectangle.collidesWithPoint on the server: "in range of an NPC"
 * means the player's point sits inside that NPC's hitbox. Duplicated here so the
 * window can grey out its Spend buttons without a round-trip — the server still
 * has the final say on every spend.
 */
function pointInRect(px: number, py: number, rect: Rect): boolean {
  const left = rect.x - rect.width * (rect.xOffsetRatio ?? 0);
  const top = rect.y - rect.height * (rect.yOffsetRatio ?? 0);
  return px >= left && px <= left + rect.width && py >= top && py <= top + rect.height;
}

/**
 * The standalone Talents window — the personal half of town progression, opened
 * from the nav like Abilities rather than by walking to a building.
 *
 * Ranks and points stream in with personal state, so they are visible from
 * anywhere. Spending still happens at the Tower (the server enforces it), so the
 * window offers a Walk to Tower button instead of silently failing.
 */
export const TalentsPage: React.FC = () => {
  const socket = useSocketStore((state) => state.socket);
  const { spendTalent, setTargetNpc } = useNpcActions(socket);
  const talentsState = usePersonalChannelStore((state) => state.displayedState?.talents);
  const playerHitbox = usePlayerStore((state) => state.player?.hitbox);
  const npcs = useSocketStore((state) => state.gameState?.npcs);

  if (!talentsState) {
    return <p className="text-sm text-gray-400 p-2">Loading talents…</p>;
  }

  const tower = (npcs as any[] | undefined)?.find((npc) => npc?.npcId === TOWER_NPC_ID);
  const atTower =
    !!playerHitbox &&
    !!tower?.hitbox &&
    pointInRect(playerHitbox.x, playerHitbox.y, tower.hitbox);

  const { points, level, maxLevel, trainerAvailable, talents } = talentsState;
  const canSpend = trainerAvailable && atTower;

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-center text-gray-400">
          Level {level}/{maxLevel} — one talent point per level.
        </p>
        <p
          className="text-sm text-center font-bold"
          style={{ color: points > 0 ? "#f0d060" : "#888" }}
        >
          {points} unspent point{points === 1 ? "" : "s"}
        </p>
      </div>

      {!trainerAvailable ? (
        <p
          className="text-xs px-2 py-2 rounded text-center"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid #9a3a3a",
            color: "#f0a0a0",
          }}
        >
          The Tower is still in ruins — rebuild it before anyone can train talents.
        </p>
      ) : !atTower ? (
        <div
          className="flex flex-col gap-2 px-2 py-2 rounded"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-xs text-center" style={{ color: "#f0d8a8" }}>
            Talents are trained at the Tower.
          </p>
          <button
            onClick={() => setTargetNpc(TOWER_NPC_ID)}
            className="px-3 py-1 text-xs cursor-pointer self-center"
            style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
          >
            Walk to Tower
          </button>
        </div>
      ) : null}

      <TalentList
        talents={talents}
        points={points}
        canSpend={canSpend}
        onSpend={(talentId) => spendTalent(TOWER_NPC_ID, talentId)}
      />
    </div>
  );
};
