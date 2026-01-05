import { useState } from "react";
import { metadataService } from "../services/MetadataService";

export type Ability = {
  slot: string;
  abilityId: string;
  name: string;
  cooldown: number;
  lastUsed: number;
  castTime: number;
};

// TODO MC: 16 Ticks

export const Abilitiy: React.FC<{ ability: Ability }> = ({ ability }) => {
  const abilityMetaData = metadataService.getAbilitySync(ability.abilityId)!;
  const [cooldown, setCooldown] = useState(0);

  const handleAbilityClick = (ability: Ability) => {
    setCooldown(ability.cooldown);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 100);
  };

  const isOnCooldown = cooldown > 0;
  const cooldownPercentage = (cooldown / ability.cooldown) * 100;

  return (
    <button
      key={ability.slot}
      onClick={() => handleAbilityClick(ability)}
      disabled={isOnCooldown}
      data-tooltip-id="ability-tooltip"
      data-tooltip-content={
        abilityMetaData.name + ": " + abilityMetaData.description
      }
      data-tooltip-place="top"
      className={`relative size-16 border-2 bg-gray-800 ${
        isOnCooldown
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-700 cursor-pointer"
      }`}
    >
      {/* Icon */}
      <p className="text-xs text-white cursor-crosshair">
        {abilityMetaData.name}
      </p>
      {/* <img
        src={`https://cdn.onestreamrpg.com/images/items/20_bagel.png`}
        alt={ability.name}
        className="size-full"
        style={{ imageRendering: "pixelated" }}
      /> */}

      {/* Cooldown overlay */}
      {isOnCooldown && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/70"
            style={{ height: `${cooldownPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {Math.ceil((ability.cooldown - cooldown) / 100)}s
            </span>
          </div>
        </>
      )}
    </button>
  );
};
