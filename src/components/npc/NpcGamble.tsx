import { useEffect, useState } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { metadataService } from "../../services/MetadataService";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useNpcStore } from "../../store/useNpcStore";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_EMOJI,
  MaterialCategory,
} from "../inventory/types";
import { GambleMenuData } from "../../types/npcInteraction";

const materialName = (cat: MaterialCategory): string =>
  metadataService.getItemSync(cat)?.name ?? cat;

export const NpcGamble: React.FC<{ data: GambleMenuData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { gamble } = useNpcActions(socket);

  const counts = usePersonalChannelStore(
    (state) => state.displayedState?.inventory?.materialCounts
  );
  const caps = usePersonalChannelStore(
    (state) => state.displayedState?.inventory?.materialCaps
  );

  const gambleResult = useNpcStore((state) => state.gambleResult);
  const setGambleResult = useNpcStore((state) => state.setGambleResult);

  const npcMeta = metadataService.getNpcSync(data.npcId);
  const npcName = npcMeta?.name ?? data.npcId;

  const [selected, setSelected] = useState<MaterialCategory>(MATERIAL_CATEGORIES[0]);
  const [qty, setQty] = useState(1);
  // True from clicking "Gamble" until the flip resolves (or we reset). The result
  // itself lives in the store; we clear it on click so a fresh flip can't show a
  // stale outcome.
  const [pending, setPending] = useState(false);
  // Set once the landing coin-flip animation finishes, gating the win/lose reveal.
  const [revealed, setRevealed] = useState(false);

  // Drop any leftover result when the menu first opens.
  useEffect(() => {
    setGambleResult(null);
  }, [setGambleResult]);

  const count = counts?.[selected] ?? 0;
  const cap = caps?.[selected] ?? 0;
  const overCap = cap > 0 && count > cap;
  const canWager = count > 0 && !overCap;
  const maxWager = Math.max(1, count);
  // Held counts shift as deltas land, so clamp at render time rather than syncing.
  const wager = Math.max(1, Math.min(qty, maxWager));

  // Derive the view: waiting on the flip → "flipping"; a resolved win/loss →
  // "result"; everything else (including a rejected wager, which toasts its
  // reason) → the picker.
  const flipping = pending && !gambleResult;
  const showResult = gambleResult?.success === true;

  const handleGamble = () => {
    if (!canWager) return;
    setGambleResult(null);
    setRevealed(false);
    setPending(true);
    gamble(data.npcId, selected, wager);
  };

  const reset = () => {
    setGambleResult(null);
    setPending(false);
    setRevealed(false);
  };

  // Indeterminate wait for the server's coin flip — a simple idle spin.
  if (flipping) {
    return (
      <div className="flex flex-col items-center gap-4 min-w-64 p-4">
        <h2 className="text-lg font-bold text-center">{npcName}</h2>
        <div className="coin-scene">
          <span className="text-6xl animate-spin block" style={{ animationDuration: "0.6s" }}>
            🪙
          </span>
        </div>
        <p className="text-sm text-gray-400">Flipping…</p>
      </div>
    );
  }

  // Outcome is known — play the landing flip, then reveal once it settles.
  if (showResult && gambleResult) {
    const won = gambleResult.won;
    return (
      <div className="flex flex-col items-center gap-4 min-w-64 p-4">
        <h2 className="text-lg font-bold text-center">{npcName}</h2>

        <div className="coin-scene">
          <div
            className={`coin ${won ? "coin--win" : "coin--lose"}`}
            onAnimationEnd={() => setRevealed(true)}
          >
            <div className="coin-face coin-face--front">🎉</div>
            <div className="coin-face coin-face--back">💀</div>
          </div>
        </div>

        {revealed ? (
          <>
            <p
              className="text-base font-bold text-center"
              style={{ color: won ? "#4a9a4a" : "#e07050" }}
            >
              {won ? "You won!" : "You lost!"}
            </p>
            <p className="text-sm text-center text-gray-300">{gambleResult.message}</p>
            <p className="text-xs text-gray-400">
              {MATERIAL_CATEGORY_EMOJI[gambleResult.itemId as MaterialCategory] ?? ""}{" "}
              {materialName(gambleResult.itemId as MaterialCategory)}: {gambleResult.newCount}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 cursor-pointer text-sm"
            >
              Gamble again
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-400">Flipping…</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-64 p-2">
      <h2 className="text-lg font-bold text-center">{npcName}</h2>
      <p className="text-xs text-center text-gray-400">
        Pick a material and wager it on a 50/50 flip — win and it doubles, lose
        and it's gone.
      </p>

      {/* Material picker */}
      <div className="flex gap-2 justify-center">
        {MATERIAL_CATEGORIES.map((cat) => {
          const c = counts?.[cat] ?? 0;
          const cp = caps?.[cat] ?? 0;
          const isOver = cp > 0 && c > cp;
          const isSelected = cat === selected;
          return (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer text-xs"
              style={{
                background: isSelected ? "#3d1a06" : "rgba(0,0,0,0.3)",
                border: `1px solid ${isSelected ? "#9a7228" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <span className="text-xl leading-none">{MATERIAL_CATEGORY_EMOJI[cat]}</span>
              <span style={{ color: isOver ? "#e07050" : "#f0d8a8" }}>
                {c}/{cp}
              </span>
            </button>
          );
        })}
      </div>

      {overCap ? (
        <p className="text-xs text-center" style={{ color: "#e07050" }}>
          You're over the cap on {materialName(selected)} — spend some first.
        </p>
      ) : count <= 0 ? (
        <p className="text-xs text-center text-gray-400">
          You don't have any {materialName(selected)} to wager.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span>Wager</span>
            <span style={{ color: "#f0d8a8" }}>
              {wager}x {materialName(selected)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxWager}
            value={wager}
            onChange={(e) =>
              setQty(Math.max(1, Math.min(maxWager, parseInt(e.target.value) || 1)))
            }
            className="w-full cursor-pointer"
          />
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={maxWager}
              value={wager}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(maxWager, parseInt(e.target.value) || 1)))
              }
              className="w-16 text-sm text-center rounded px-1 py-0.5"
              style={{ background: "#1a1a2e", border: "1px solid #555", color: "#f0d8a8" }}
            />
            <button
              onClick={() => setQty(maxWager)}
              className="px-2 py-1 text-xs cursor-pointer"
              style={{ background: "#1a1a2e", border: "1px solid #555", color: "#f0d8a8" }}
            >
              Max
            </button>
            <span className="text-xs text-gray-400 flex-1">{count} owned</span>
          </div>
        </div>
      )}

      <button
        onClick={handleGamble}
        disabled={!canWager}
        className="px-4 py-2 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
      >
        Gamble
      </button>
    </div>
  );
};
