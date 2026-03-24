import React from "react";
import { Tooltip } from "react-tooltip";
import { isEmptyAbility } from "../abilityService";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { Ability } from "./Ability";
import { AbilityTooltip } from "./abilities/AbilityTooltip";
import { CalcBreakdown } from "./ui/CalcBreakdown";
import { ResolvedToken } from "../utils/resolveScaling";

export const AbilitiesNav: React.FC = () => {
  const { displayedState } = usePersonalChannelStore();
  const stats = displayedState?.stats;

  if (!displayedState)
    return (
      <nav className="pointer-events-auto flex gap-2">
        {/* No abilities available */}
        <span style={{ color: "#9a7850" }}>Loading or error...</span>
      </nav>
    );

  return (
    <nav className="pointer-events-auto flex gap-2">
      {displayedState.abilities.equipped.map((ability: Ability) =>
        !isEmptyAbility(ability) ? (
          <Ability key={ability.slot} ability={ability} />
        ) : (
          <div
            key={ability.slot}
            className="relative size-12"
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
          />
        )
      )}

      <Tooltip
        id="ability-tooltip"
        delayShow={300}
        clickable
        render={({ activeAnchor }) => {
          const abilityId = activeAnchor?.getAttribute("data-ability-id");
          if (!abilityId || !stats) return null;
          return <AbilityTooltip abilityId={abilityId} stats={stats} />;
        }}
      />
      <Tooltip
        id="ability-calc-tooltip"
        delayShow={0}
        render={({ activeAnchor }) => {
          const raw = activeAnchor?.getAttribute("data-breakdown");
          if (!raw) return null;
          try {
            return <CalcBreakdown resolved={JSON.parse(raw) as ResolvedToken} />;
          } catch {
            return null;
          }
        }}
      />
    </nav>
  );
};
