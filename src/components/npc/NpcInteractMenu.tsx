import { useEffect } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { logger } from "../../services/Logger";
import { metadataService } from "../../services/MetadataService";
import { useSocketStore } from "../../store/socketStore";
import { useNpcStore } from "../../store/useNpcStore";
import { InteractData } from "../../types/npcInteraction";

const TAG = "NpcInteractMenu";

// Every NPC definition is meant to carry a blurb, so a gap is worth one log
// line — but only the first time we see it for that NPC.
const warnedMissingDescription = new Set<string>();

export const NpcInteractMenu: React.FC<{ data: InteractData }> = ({
  data,
}) => {
  const socket = useSocketStore((state) => state.socket);
  const npcActions = useNpcActions(socket);

  // The payload titles the panel; metadata is only the fallback.
  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = data.name ?? npcMeta?.name ?? data.npcId;
  // What upgrading would actually buy, shown here rather than only behind the
  // Upgrade button. Absent on a maxed or non-upgradable NPC.
  const upgradeHint = data.upgradeDescription?.trim();

  useEffect(() => {
    if (data.description || warnedMissingDescription.has(data.npcId)) return;
    warnedMissingDescription.add(data.npcId);
    logger.warn(TAG, `NPC "${data.npcId}" has no description — its definition is missing a blurb.`);
  }, [data.npcId, data.description]);

  const handleInteraction = (type: string, questId?: string) => {
    if (type === "acceptQuest" && questId) {
      npcActions.acceptQuest(data.npcId, questId);
      return;
    }

    if (type === "sell") {
      useNpcStore.getState().updatePopupData({ type: "sellMenu", npcId: data.npcId });
      return;
    }

    if (type === "gamble") {
      // Purely client-side menu — no server round-trip to open it.
      useNpcStore.getState().setGambleResult(null);
      useNpcStore.getState().updatePopupData({ type: "gambleMenu", npcId: data.npcId });
      return;
    }

    const actionMap: Record<string, (npcId?: string) => void> = {
      shop: npcActions.shop,
      craft: npcActions.craftList,
      dialogue: npcActions.dialogue,
      arena: npcActions.arena,
      summon: npcActions.summon,
      trade: npcActions.trade,
      stash: npcActions.stash,
      upgrade: (npcId) => npcId && npcActions.npcUpgrade(npcId),
      townUpgrade: (npcId) => npcId && npcActions.townUpgradeInfo(npcId),
      talents: (npcId) => npcId && npcActions.talentInfo(npcId),
    };

    const action = actionMap[type];
    if (action) {
      action(data.npcId);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-48">
      <h2 className="text-lg font-bold text-center">{npcName}</h2>
      {data.description && (
        <p className="max-w-64 text-center text-xs leading-snug text-gray-400">
          {data.description}
        </p>
      )}
      {data.level !== undefined && (
        <p
          className="text-center text-xs"
          style={{ color: data.maxLevel ? "#a0d0ff" : "#9ca3af" }}
        >
          Level {data.level}
          {data.maxLevel ? " — Max Level" : ""}
        </p>
      )}
      {upgradeHint && (
        <p
          // Styled to match the "Next level:" box in the upgrade panel, which
          // shows this same text.
          className="max-w-64 rounded px-2 py-1 text-xs leading-snug"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a0d0ff",
          }}
        >
          <span className="font-semibold">Next level:</span> {upgradeHint}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {data.availableInteractions
          .filter((entry) => entry.type !== "interact")
          .map((entry) => (
            <button
              key={`${entry.type}-${entry.questId ?? ""}`}
              onClick={() => handleInteraction(entry.type, entry.questId)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 cursor-pointer text-sm"
            >
              {entry.label}
            </button>
          ))}
      </div>
    </div>
  );
};
