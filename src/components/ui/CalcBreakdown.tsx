import { ResolvedToken } from "../../utils/resolveScaling";

export const CalcBreakdown: React.FC<{ resolved: ResolvedToken }> = ({ resolved }) => {
  const baseTerm = resolved.breakdown.find((t) => t.label === "base");
  const statTerms = resolved.breakdown.filter((t) => t.label !== "base");

  return (
    <div className="flex items-center gap-1 text-xs font-mono p-1 flex-wrap">
      <span style={{ color: "#c8a020" }}>{resolved.total}</span>
      <span>=</span>
      <span>{baseTerm?.contribution ?? 0}</span>
      {statTerms.map((term, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span>+</span>
          <span>{Math.round((term.coefficient ?? 0) * 100)}%</span>
          <img
            src={`/media/img/icons/stats/${term.label}.png`}
            width={12}
            height={12}
            alt={term.label}
            title={term.label}
          />
        </span>
      ))}
    </div>
  );
};
