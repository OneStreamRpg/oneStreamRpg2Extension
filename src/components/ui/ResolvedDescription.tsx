import { resolveScaling, tokenizeDescription, ScalingMap } from "../../utils/resolveScaling";

interface Props {
  description: string;
  scaling?: ScalingMap;
  stats: Record<string, number>;
  calcTooltipId: string;
}

export const ResolvedDescription: React.FC<Props> = ({
  description,
  scaling,
  stats,
  calcTooltipId,
}) => {
  const resolved = scaling ? resolveScaling(scaling, stats) : new Map();
  const segments = tokenizeDescription(description, resolved);

  return (
    <p>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }
        return (
          <span
            key={i}
            data-tooltip-id={calcTooltipId}
            data-breakdown={JSON.stringify(seg.resolved)}
            className="text-yellow-300 underline decoration-dotted cursor-help"
          >
            {seg.total}
          </span>
        );
      })}
    </p>
  );
};
