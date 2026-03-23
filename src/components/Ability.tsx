import { useState } from "react";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { AbilitySlotType, metadataService } from "../services/MetadataService";
import { useSocketStore } from "../store/socketStore";
import { CdnIcon } from "./ui/CdnIcon";

export type Ability = {
  slot: AbilitySlotType;
  abilityId: string;
};

const TICKS_PER_SECOND = 16;
const MS_PER_TICK = 1000 / TICKS_PER_SECOND;
const ticksToMs = (ticks: number) => ticks * MS_PER_TICK;

export const Ability: React.FC<{ ability: Ability }> = ({ ability }) => {
  const socket = useSocketStore((state) => state.socket);
  const { castAbility } = usePersonalChannelActions(socket);
  const abilityMetaData = metadataService.getAbilitySync(ability.abilityId)!;
  const [cooldown, setCooldown] = useState(0);
  const cooldownTime =
    abilityMetaData.cooldownMs + ticksToMs(abilityMetaData.castTime);

  const handleAbilityClick = () => {
    castAbility(ability.slot);

    setCooldown(cooldownTime);

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev > 0) {
          return prev - 1000;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);
  };

  const isOnCooldown = cooldown > 0;
  const cooldownPercentage = (cooldown / cooldownTime) * 100;

  return (
    <button
      key={ability.slot}
      onClick={() => handleAbilityClick()}
      disabled={isOnCooldown}
      data-tooltip-id="ability-tooltip"
      data-tooltip-content={
        abilityMetaData.name + ": " + abilityMetaData.description
      }
      data-tooltip-place="top"
      className={`relative size-12 overflow-hidden ${isOnCooldown ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-125"}`}
      style={{
        backgroundColor: "#231206",
        borderTop: "3px solid #9a7228",
        borderBottom: "3px solid #3d1a06",
        borderLeft: "3px solid #3d1a06",
        borderRight: "3px solid #3d1a06",
        boxShadow: [
          "inset 0 2px 0 rgba(255,220,120,0.12)",
          "inset 6px 0 0 #2d1a0a",
          "inset -6px 0 0 #2d1a0a",
          "inset 0 4px 0 rgba(255,220,120,0.08)",
          "inset 0 6px 0 #2d1a0a",
          "inset 0 -2px 0 #2d1a0a",
          "inset 0 -4px 0 rgba(0,0,0,0.3)",
          "inset 0 -6px 0 #2d1a0a",
          "inset 0px 0px 20px -5px #0a0502",
          "0px 0px 8px 0px rgba(0,0,0,0.8)",
        ].join(", "),
      }}
    >
      <CdnIcon
        type="abilities"
        id={ability.abilityId}
        className="size-full"
        alt={abilityMetaData.name}
      />

      {/* Cooldown overlay */}
      {isOnCooldown && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/70"
            style={{ height: `${cooldownPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {Math.ceil(cooldown / 1000)}s
            </span>
          </div>
        </>
      )}
    </button>
  );
};
