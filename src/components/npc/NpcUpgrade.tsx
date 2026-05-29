import { useState } from "react";
import { useNpcActions } from "../../hooks/useNpcActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { NpcUpgradeData } from "../../types/npcInteraction";

export const NpcUpgrade: React.FC<{ data: NpcUpgradeData }> = ({ data }) => {
  const socket = useSocketStore((state) => state.socket);
  const { npcDeposit } = useNpcActions(socket);
  const inventoryItems = usePersonalChannelStore(
    (state) => state.displayedState?.inventory?.items ?? []
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getPlayerQty = (itemId: string): number =>
    (inventoryItems as any[])
      .filter((item) => item?.itemId === itemId)
      .reduce((sum, item) => sum + (item?.quantity ?? 0), 0);

  if (data.maxLevel) {
    return (
      <div className="flex flex-col gap-2 min-w-64 p-2">
        <h2 className="text-lg font-bold text-center">{data.name}</h2>
        <p className="text-sm text-center" style={{ color: "#a0d0ff" }}>
          Level {data.level} — Max Level
        </p>
      </div>
    );
  }

  const requirements = data.upgradeRequirements ?? [];

  return (
    <div className="flex flex-col gap-3 min-w-64 p-2">
      <h2 className="text-lg font-bold text-center">{data.name}</h2>
      <p className="text-sm text-center text-gray-400">Level {data.level}</p>

      <div className="flex flex-col gap-3">
        {requirements.map((req) => {
          const deposited = data.depositedAmounts[req.itemId] ?? 0;
          const remaining = req.quantity - deposited;
          const playerHas = getPlayerQty(req.itemId);
          const maxDeposit = Math.min(remaining, playerHas);
          const qty = quantities[req.itemId] ?? Math.min(1, maxDeposit);
          const pct = Math.min(100, (deposited / req.quantity) * 100);

          return (
            <div key={req.itemId} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{req.itemId}</span>
                <span style={{ color: deposited >= req.quantity ? "#4a9a4a" : "#f0d8a8" }}>
                  {deposited} / {req.quantity}
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
                    background: pct >= 100 ? "#4a9a4a" : "linear-gradient(90deg, #c8a020, #f0d060)",
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
                    max={Math.max(1, maxDeposit)}
                    value={qty}
                    disabled={maxDeposit <= 0}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(maxDeposit, parseInt(e.target.value) || 1));
                      setQuantities((prev) => ({ ...prev, [req.itemId]: val }));
                    }}
                    className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={maxDeposit}
                      value={qty}
                      disabled={maxDeposit <= 0}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(maxDeposit, parseInt(e.target.value) || 1));
                        setQuantities((prev) => ({ ...prev, [req.itemId]: val }));
                      }}
                      className="w-16 text-sm text-center rounded px-1 py-0.5"
                      style={{ background: "#1a1a2e", border: "1px solid #555", color: "#f0d8a8" }}
                    />
                    <button
                      onClick={() =>
                        setQuantities((prev) => ({ ...prev, [req.itemId]: maxDeposit }))
                      }
                      disabled={maxDeposit <= 0}
                      className="px-2 py-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "#1a1a2e", border: "1px solid #555", color: "#f0d8a8" }}
                    >
                      Max
                    </button>
                    <span className="text-xs text-gray-400 flex-1">{playerHas} owned</span>
                    <button
                      onClick={() => npcDeposit(data.npcId, req.itemId, qty)}
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
                  Complete!
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
