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
      className={`relative size-16 border-2 bg-gray-800 overflow-hidden ${
        isOnCooldown
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-700 cursor-pointer"
      }`}
    >
      <CdnIcon
        type="items"
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
            <span className="text-white text-sm font-bold">
              {Math.ceil(cooldown / 1000)}s
            </span>
          </div>
        </>
      )}
    </button>
  );
};
