export type ScalingEntry = { base?: number; [stat: string]: number | undefined };
export type ScalingMap = Record<string, ScalingEntry>;

export type BreakdownTerm = {
  label: string;
  statValue?: number;
  coefficient?: number;
  contribution: number;
};

export type ResolvedToken = {
  token: string;
  total: number;
  breakdown: BreakdownTerm[];
};

export function resolveScaling(
  scaling: ScalingMap,
  stats: Record<string, number>
): Map<string, ResolvedToken> {
  const result = new Map<string, ResolvedToken>();

  for (const [token, entry] of Object.entries(scaling)) {
    const breakdown: BreakdownTerm[] = [];
    let total = 0;

    const base = entry.base ?? 0;
    breakdown.push({ label: "base", contribution: base });
    total += base;

    for (const [key, coef] of Object.entries(entry)) {
      if (key === "base" || coef === undefined) continue;
      const statValue = stats[key] ?? 0;
      const contribution = Math.floor(statValue * coef);
      breakdown.push({ label: key, statValue, coefficient: coef, contribution });
      total += contribution;
    }

    result.set(token, { token, total, breakdown });
  }

  return result;
}

type TextSegment = { type: "text"; value: string };
type TokenSegment = { type: "token"; token: string; total: number; resolved: ResolvedToken };
export type DescriptionSegment = TextSegment | TokenSegment;

export function tokenizeDescription(
  description: string,
  resolved: Map<string, ResolvedToken>
): DescriptionSegment[] {
  const segments: DescriptionSegment[] = [];
  const regex = /\[\[(\w+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(description)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: description.slice(lastIndex, match.index) });
    }

    const token = match[1];
    const resolvedToken = resolved.get(token);
    if (resolvedToken) {
      segments.push({ type: "token", token, total: resolvedToken.total, resolved: resolvedToken });
    } else {
      segments.push({ type: "text", value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < description.length) {
    segments.push({ type: "text", value: description.slice(lastIndex) });
  }

  return segments;
}
