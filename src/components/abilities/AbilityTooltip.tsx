import { metadataService } from "../../services/MetadataService";
import { ResolvedDescription } from "../ui/ResolvedDescription";

interface Props {
  abilityId: string;
  stats: Record<string, number>;
}

export const AbilityTooltip: React.FC<Props> = ({ abilityId, stats }) => {
  const ability = metadataService.getAbilitySync(abilityId);

  if (!ability) {
    return <div className="p-2 text-gray-400">Unknown ability</div>;
  }

  return (
    <div className="max-w-xs p-2">
      <p className="font-bold text-sm mb-1">{ability.name}</p>
      <ResolvedDescription
        description={ability.description}
        scaling={ability.scaling}
        stats={stats}
        calcTooltipId="ability-calc-tooltip"
      />
    </div>
  );
};
