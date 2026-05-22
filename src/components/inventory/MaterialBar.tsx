import { MaterialMap } from "../../types/personalChannel";
import { MATERIAL_CATEGORIES, MATERIAL_CATEGORY_EMOJI } from "./types";

export const MaterialBar: React.FC<{
  caps: MaterialMap;
  counts: MaterialMap;
}> = ({ caps, counts }) => {
  return (
    <section className="flex items-center justify-around gap-2 mb-2 px-2 py-1 bg-amber-100/40 border border-amber-900/30 rounded">
      {MATERIAL_CATEGORIES.map((cat) => {
        const count = counts[cat] ?? 0;
        const cap = caps[cat] ?? 0;
        const atCap = cap > 0 && count >= cap;
        return (
          <div
            key={cat}
            className={`flex items-center gap-1 text-xs font-bold ${
              atCap ? "text-red-600 animate-pulse" : "text-amber-900"
            }`}
            title={`${cat}: ${count}/${cap}`}
          >
            <span className="text-base leading-none">{MATERIAL_CATEGORY_EMOJI[cat]}</span>
            <span>
              {count}/{cap}
            </span>
          </div>
        );
      })}
    </section>
  );
};
