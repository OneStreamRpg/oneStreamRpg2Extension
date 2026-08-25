import { useState } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { TownUpgradeInfoData, TownUpgradeTrack } from "../../types/npcInteraction";

/**
 * The Guild's shared upgrade tracks. Every track is funded from one town-wide
 * pot, so the progress bars show what EVERYONE has contributed, not just this
 * player. One track is expanded at a time to keep the panel inside the
 * extension's cramped viewport.
 */
export const NpcTownUpgrades: React.FC<{ data: TownUpgradeInfoData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { townUpgradeDeposit } = useNpcActions(socket);
  const inventoryItems = usePersonalChannelStore(
    (state) => state.displayedState?.inventory?.items ?? []
  );

  const [expanded, setExpanded] = useState<string | null>(
    data.tracks.find((t) => t.level < t.maxLevel)?.trackId ?? null
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getPlayerQty = (itemId: string): number =>
    (inventoryItems as any[])
      .filter((item) => item?.itemId === itemId)
      .reduce((sum, item) => sum + (item?.quantity ?? 0), 0);

  return (
    <div className="flex flex-col gap-3 min-w-72 max-w-80 p-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-center">Town Upgrades</h2>
        <p className="text-xs text-center text-gray-400">
          Funded by the whole town — every level applies to everyone.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {data.tracks.map((track) => (
          <TownUpgradeRow
            key={track.trackId}
            track={track}
            isOpen={expanded === track.trackId}
            onToggle={() =>
              setExpanded((cur) => (cur === track.trackId ? null : track.trackId))
            }
            getPlayerQty={getPlayerQty}
            quantities={quantities}
            setQuantities={setQuantities}
            onDeposit={(itemId, qty) =>
              townUpgradeDeposit(data.npcId, track.trackId, itemId, qty)
            }
          />
        ))}
      </div>
    </div>
  );
};

const TownUpgradeRow: React.FC<{
  track: TownUpgradeTrack;
  isOpen: boolean;
  onToggle: () => void;
  getPlayerQty: (itemId: string) => number;
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onDeposit: (itemId: string, quantity: number) => void;
}> = ({ track, isOpen, onToggle, getPlayerQty, quantities, setQuantities, onDeposit }) => {
  // maxLevel is the ceiling (10), not a flag — the track is done at that level.
  const maxed = track.level >= track.maxLevel;
  // Capped by the Guild's level is not the same as finished: the track can be
  // resumed by upgrading the Guild.
  const atCap = !maxed && track.level >= track.levelCap;
  const overallPct =
    track.progressMax > 0 ? Math.min(100, (track.progress / track.progressMax) * 100) : 0;

  return (
    <div
      className="flex flex-col rounded"
      style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${isOpen ? "#9a7228" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <button
        onClick={onToggle}
        disabled={maxed}
        className="flex justify-between items-center px-2 py-2 text-left cursor-pointer disabled:cursor-default"
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{track.name}</span>
          <span className="text-xs" style={{ color: "#a0d0ff" }}>
            {track.effect}
          </span>
        </span>
        <span
          className="text-xs font-bold whitespace-nowrap"
          style={{ color: maxed ? "#4a9a4a" : "#f0d8a8" }}
        >
          Lv.{track.level}
          {maxed ? " MAX" : `/${track.maxLevel}`}
        </span>
      </button>

      {isOpen && !maxed && (
        <div className="flex flex-col gap-3 px-2 pb-2">
          <p className="text-xs text-gray-400">{track.description}</p>

          {atCap && (
            <p
              className="text-xs px-2 py-1 rounded text-center"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid #9a3a3a",
                color: "#f0a0a0",
              }}
            >
              The Guild funds this to level {track.levelCap}. Upgrade the Guild to go further.
            </p>
          )}
          {!atCap && (
            <>
              <p className="text-xs" style={{ color: "#a0d0ff" }}>
                <span className="font-semibold">Funding level {track.level + 1}</span> —{" "}
                {track.progress}/{track.progressMax} materials
              </p>

              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: "2px",
                  height: "4px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${overallPct}%`,
                    background: "linear-gradient(90deg, #c8a020, #f0d060)",
                    borderRadius: "2px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </>
          )}

          {!atCap && track.cost.map((req) => {
            const key = `${track.trackId}:${req.itemId}`;
            const remaining = req.quantity - req.deposited;
            const playerHas = getPlayerQty(req.itemId);
            const maxDeposit = Math.min(remaining, playerHas);
            const qty = quantities[key] ?? Math.min(1, maxDeposit);
            const pct = Math.min(100, (req.deposited / req.quantity) * 100);

            // The slider track spans everything the town still needs, so the
            // handle reads as a share of the real requirement — carrying 5 of
            // 500 should look like 5 of 500, not "full".
            const sliderMax = Math.max(1, remaining);
            const affordablePct = (Math.min(maxDeposit, sliderMax) / sliderMax) * 100;
            const selectedPct = (Math.min(qty, sliderMax) / sliderMax) * 100;

            return (
              <div key={req.itemId} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span>{req.itemName}</span>
                  <span style={{ color: req.deposited >= req.quantity ? "#4a9a4a" : "#f0d8a8" }}>
                    {req.deposited} / {req.quantity}
                  </span>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: "2px",
                    height: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background:
                        pct >= 100 ? "#4a9a4a" : "linear-gradient(90deg, #c8a020, #f0d060)",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {remaining > 0 ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <input
                      type="range"
                      min={1}
                      max={sliderMax}
                      value={qty}
                      disabled={maxDeposit <= 0}
                      onChange={(e) => {
                        const val = Math.max(
                          1,
                          Math.min(maxDeposit, parseInt(e.target.value) || 1)
                        );
                        setQuantities((prev) => ({ ...prev, [key]: val }));
                      }}
                      className="upgrade-slider w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background: `linear-gradient(90deg,
                          #f0d060 0%, #f0d060 ${selectedPct}%,
                          #6a5320 ${selectedPct}%, #6a5320 ${affordablePct}%,
                          #2a1a0a ${affordablePct}%, #2a1a0a 100%)`,
                      }}
                      title={`${qty} of ${remaining} still needed`}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={1}
                        max={maxDeposit}
                        value={qty}
                        disabled={maxDeposit <= 0}
                        onChange={(e) => {
                          const val = Math.max(
                            1,
                            Math.min(maxDeposit, parseInt(e.target.value) || 1)
                          );
                          setQuantities((prev) => ({ ...prev, [key]: val }));
                        }}
                        className="w-14 text-xs text-center rounded px-1 py-0.5"
                        style={{
                          background: "#1a1a2e",
                          border: "1px solid #555",
                          color: "#f0d8a8",
                        }}
                      />
                      <button
                        onClick={() =>
                          setQuantities((prev) => ({ ...prev, [key]: maxDeposit }))
                        }
                        disabled={maxDeposit <= 0}
                        className="px-2 py-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: "#1a1a2e",
                          border: "1px solid #555",
                          color: "#f0d8a8",
                        }}
                      >
                        Max
                      </button>
                      <span className="text-xs text-gray-400 flex-1">{playerHas} owned</span>
                      <button
                        onClick={() => onDeposit(req.itemId, qty)}
                        disabled={maxDeposit <= 0}
                        className="px-3 py-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#3d1a06", border: "1px solid #9a7228" }}
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-right" style={{ color: "#4a9a4a" }}>
                    Funded!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
