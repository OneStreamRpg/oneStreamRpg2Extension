import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

type Ability = {
  id: string;
  name: string;
  icon: string;
  cooldown: number; // in milliseconds
  description: string;
};

const ABILITIES: Ability[] = [
  {
    id: "fireball",
    name: "Fireball",
    icon: "fireball",
    cooldown: 5000,
    description:
      "Launch a blazing fireball that deals damage to enemies in its path.",
  },
  {
    id: "heal",
    name: "Heal",
    icon: "heal",
    cooldown: 10000,
    description:
      "Restore health over time. More powerful when you're low on HP.",
  },
  {
    id: "shield",
    name: "Shield",
    icon: "shield",
    cooldown: 15000,
    description:
      "Create a protective barrier that absorbs incoming damage for 5 seconds.",
  },
  {
    id: "dash",
    name: "Dash",
    icon: "dash",
    cooldown: 3000,
    description:
      "Quickly dash forward, becoming invulnerable for a brief moment.",
  },
];

export const AbilitiesNav: React.FC = () => {
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  const handleAbilityClick = (ability: Ability) => {
    // Don't activate if on cooldown
    if (cooldowns[ability.id]) return;

    // Set cooldown
    setCooldowns((prev) => ({ ...prev, [ability.id]: ability.cooldown }));

    // Start cooldown countdown
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const remaining = prev[ability.id] - 100;
        if (remaining <= 0) {
          clearInterval(interval);
          // Remove the ability from cooldowns
          const newCooldowns = { ...prev };
          delete newCooldowns[ability.id];
          return newCooldowns;
        }
        return { ...prev, [ability.id]: remaining };
      });
    }, 100);

    // TODO MC: Trigger ability action
    console.log(`Activated ability: ${ability.name}`);
  };

  return (
    <nav className="pointer-events-auto flex gap-2">
      {ABILITIES.map((ability) => {
        const isOnCooldown = !!cooldowns[ability.id];
        const cooldownPercentage = isOnCooldown
          ? (cooldowns[ability.id] / ability.cooldown) * 100
          : 0;

        return (
          <button
            key={ability.id}
            onClick={() => handleAbilityClick(ability)}
            disabled={isOnCooldown}
            data-tooltip-id="ability-tooltip"
            data-tooltip-content={ability.description}
            data-tooltip-place="top"
            className={`relative size-16 border-2 bg-gray-800 ${
              isOnCooldown
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-700 cursor-pointer"
            }`}
          >
            {/* Icon */}
            <img
              src={`https://cdn.onestreamrpg.com/images/items/20_bagel.png`}
              alt={ability.name}
              className="size-full"
              style={{ imageRendering: "pixelated" }}
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
                    {Math.ceil(cooldowns[ability.id] / 1000)}s
                  </span>
                </div>
              </>
            )}
          </button>
        );
      })}

      <Tooltip id="ability-tooltip" delayShow={300} />
    </nav>
  );
};
