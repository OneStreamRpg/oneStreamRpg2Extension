import { ResolvedToken } from "../../utils/resolveScaling";

export const CalcBreakdown: React.FC<{ resolved: ResolvedToken }> = ({ resolved }) => {
  return (
    <div className="text-xs font-mono p-1 min-w-32">
      <p className="text-gray-300 mb-1 capitalize">{resolved.token}</p>
      {resolved.breakdown.map((term, i) => (
        <p key={i} className="text-gray-200">
          {term.label === "base"
            ? `base ${term.contribution}`
            : `+ floor(${term.statValue} × ${term.coefficient}) = ${term.contribution}  [${term.label}]`}
        </p>
      ))}
      <p className="text-yellow-300 border-t border-gray-600 mt-1 pt-1">= {resolved.total}</p>
    </div>
  );
};
