import React from "react";
import { Tooltip } from "react-tooltip";
import { isEmptyAbility } from "../abilityService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { Abilitiy, Ability } from "./Ability";

export const AbilitiesNav: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();

  if (!displayedState)
    return (
      <nav className="pointer-events-auto flex gap-2">
        {/* No abilities available */}
        <span className="text-gray-400">Loading or error...</span>
      </nav>
    );

  return (
    <nav className="pointer-events-auto flex gap-2">
      {displayedState.abilities.equipped.map((ability: Ability) =>
        !isEmptyAbility(ability) ? (
          <Abilitiy key={ability.slot} ability={ability} />
        ) : (
          <div className="relative size-16 border-2 bg-gray-800"></div>
        )
      )}

      <Tooltip id="ability-tooltip" delayShow={300} />
    </nav>
  );
};
