import { useEffect, useMemo, useState } from "react";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useUIStore } from "../../store/useUIStore";
import { TradeItem } from "../../types/personalChannel";
import { metadataService } from "../../services/MetadataService";
import { Item } from "../inventory/types";
import { isEmptyItem } from "../inventory/inventoryService";
import { ItemDisplay } from "../inventory/ItemDisplay";
import { CdnIcon } from "../ui/CdnIcon";
import { WindowContainer } from "../ui/WindowContainer";

type OfferEntry = { instanceId: string; quantity: number };

// Renders a single offered item (icon + name + quantity).
const OfferItem: React.FC<{ item: TradeItem }> = ({ item }) => {
  const meta = metadataService.getItemSync(item.itemId);
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "#f0d8a8" }}>
      <CdnIcon
        type="items"
        id={item.itemId}
        className="size-5"
        alt={meta?.name ?? item.itemId}
      />
      <span className="truncate">{meta?.name ?? item.itemId}</span>
      {item.quantity > 1 && <span style={{ color: "#9a7850" }}>x{item.quantity}</span>}
    </span>
  );
};

export const TradeWindow: React.FC = () => {
  const socket = useSocketStore((state) => state.socket);
  const { tradeUpdateOffer, tradeSetReady, tradeConfirm, tradeCancel } =
    usePersonalChannelActions(socket);

  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  const session = displayedState?.tradeSession ?? null;
  const inventoryItems = useMemo(
    () => displayedState?.inventory.items ?? [],
    [displayedState?.inventory.items]
  );

  const tradeError = useUIStore((state) => state.tradeError);
  const setTradeError = useUIStore((state) => state.setTradeError);

  // Local gold draft so the field is editable; re-synced when the server-confirmed
  // offer changes (e.g. an offer edit resets things).
  const yourGold = session?.yourOffer.gold ?? 0;
  const [goldDraft, setGoldDraft] = useState(String(yourGold));
  useEffect(() => {
    setGoldDraft(String(yourGold));
  }, [yourGold]);

  // Inventory lookup by instance id (for max stack + metadata).
  const inventoryById = useMemo(() => {
    const map = new Map<string, Item>();
    for (const it of inventoryItems) if (it) map.set(it.id, it);
    return map;
  }, [inventoryItems]);

  if (!session) return null;

  const { phase, partner, yourOffer, partnerOffer, yourReady, partnerReady, yourConfirmed, partnerConfirmed } = session;
  const editable = phase === "negotiating";
  const offeredIds = new Set(yourOffer.items.map((i) => i.id));

  // Always send the COMPLETE desired offer. Editing resets both ready flags
  // server-side, so we just re-render from `tradeSession` on the next delta.
  const currentEntries = (): OfferEntry[] =>
    yourOffer.items.map((i) => ({ instanceId: i.id, quantity: i.quantity }));

  const commit = (items: OfferEntry[], gold: number = yourOffer.gold) => {
    setTradeError(null);
    tradeUpdateOffer(items, gold);
  };

  const addItem = (item: Item) => {
    commit([...currentEntries(), { instanceId: item.id, quantity: item.quantity }]);
  };

  const removeItem = (instanceId: string) => {
    commit(currentEntries().filter((e) => e.instanceId !== instanceId));
  };

  const setItemQty = (instanceId: string, quantity: number) => {
    const max = inventoryById.get(instanceId)?.quantity ?? quantity;
    const clamped = Math.max(1, Math.min(max, quantity));
    commit(currentEntries().map((e) => (e.instanceId === instanceId ? { ...e, quantity: clamped } : e)));
  };

  const commitGold = () => {
    const parsed = Math.max(0, Math.floor(Number(goldDraft) || 0));
    setGoldDraft(String(parsed));
    if (parsed !== yourOffer.gold) commit(currentEntries(), parsed);
  };

  const hasAnyItem = inventoryItems.some((it) => it && !isEmptyItem(it));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <WindowContainer className="w-[560px] max-w-[95vw] max-h-[80vh] overflow-y-auto" style={{ paddingRight: "8px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: "#c8a020" }}>
            Trading with {partner.username}
          </span>
          <button
            onClick={() => { setTradeError(null); tradeCancel(); }}
            className="cursor-pointer text-xs px-1.5"
            style={{ backgroundColor: "#231206", border: "1px solid #9a7228", color: "#c05050", height: 22 }}
          >
            Cancel
          </button>
        </div>

        {tradeError && (
          <p className="text-xs mb-2" style={{ color: "#c05050" }}>{tradeError}</p>
        )}

        <p className="text-xs mb-2" style={{ color: "#9a7850" }}>
          {phase === "confirming"
            ? "Offers locked — both players must confirm to complete the trade."
            : "Edit your offer below. Editing resets both ready states."}
        </p>

        {/* Two-column offers */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Your offer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold" style={{ color: "#c8a020" }}>Your offer</span>
              <StatusBadge ready={yourReady} confirmed={yourConfirmed} phase={phase} />
            </div>
            <div className="flex flex-col gap-1 mb-2 min-h-8">
              {yourOffer.items.length === 0 && yourOffer.gold === 0 && (
                <span className="text-xs" style={{ color: "#9a7850" }}>Nothing offered yet.</span>
              )}
              {yourOffer.items.map((item) => {
                const max = inventoryById.get(item.id)?.quantity ?? item.quantity;
                return (
                  <div key={item.id} className="flex items-center gap-1">
                    <OfferItem item={item} />
                    {editable && (
                      <div className="flex items-center gap-1 ml-auto">
                        {max > 1 && (
                          <input
                            type="number"
                            min={1}
                            max={max}
                            value={item.quantity}
                            onChange={(e) => setItemQty(item.id, Number(e.target.value))}
                            className="text-xs px-1 outline-none"
                            style={{ width: 44, backgroundColor: "#120a04", border: "1px solid #9a7228", color: "#f0d8a8", height: 18 }}
                          />
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="cursor-pointer shrink-0 text-xs"
                          style={{ color: "#9a7850" }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Gold */}
            <div className="flex items-center gap-1">
              <img src={`${import.meta.env.BASE_URL}media/img/icons/gold.png`} width={14} height={14} alt="Gold" />
              {editable ? (
                <input
                  type="number"
                  min={0}
                  value={goldDraft}
                  onChange={(e) => setGoldDraft(e.target.value)}
                  onBlur={commitGold}
                  onKeyDown={(e) => e.key === "Enter" && commitGold()}
                  className="text-xs px-1 outline-none"
                  style={{ width: 80, backgroundColor: "#120a04", border: "1px solid #9a7228", color: "#f0d8a8", height: 20 }}
                />
              ) : (
                <span className="text-xs" style={{ color: "#f0d8a8" }}>{yourOffer.gold}</span>
              )}
            </div>
          </div>

          {/* Partner offer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold" style={{ color: "#c8a020" }}>{partner.username}'s offer</span>
              <StatusBadge ready={partnerReady} confirmed={partnerConfirmed} phase={phase} />
            </div>
            <div className="flex flex-col gap-1 mb-2 min-h-8">
              {partnerOffer.items.length === 0 && partnerOffer.gold === 0 && (
                <span className="text-xs" style={{ color: "#9a7850" }}>Nothing offered yet.</span>
              )}
              {partnerOffer.items.map((item) => (
                <OfferItem key={item.id} item={item} />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <img src={`${import.meta.env.BASE_URL}media/img/icons/gold.png`} width={14} height={14} alt="Gold" />
              <span className="text-xs" style={{ color: "#f0d8a8" }}>{partnerOffer.gold}</span>
            </div>
          </div>
        </div>

        {/* Inventory picker (negotiating only) — mirrors the normal inventory grid */}
        {editable && (
          <div className="mb-3">
            <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Your inventory — click an item to offer</p>
            {!hasAnyItem ? (
              <span className="text-xs" style={{ color: "#9a7850" }}>No items available.</span>
            ) : (
              <div className="grid grid-cols-4 gap-2 w-fit mx-auto max-h-52 overflow-y-auto">
                {inventoryItems.map((item, index) => {
                  const empty = !item || isEmptyItem(item);
                  const offered = !!item && offeredIds.has(item.id);
                  return (
                    <div
                      key={item?.id ?? `empty-${index}`}
                      className="border border-dashed size-17 flex items-center justify-center"
                    >
                      {!empty && (
                        <button
                          onClick={() => !offered && addItem(item)}
                          disabled={offered}
                          className={`relative ${offered ? "opacity-40 cursor-default" : "cursor-pointer hover:outline-2 hover:outline-amber-400"}`}
                          title={offered ? "Already in your offer" : `Offer ${metadataService.getItemSync(item.itemId)?.name ?? item.itemId}`}
                        >
                          <ItemDisplay item={item} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2">
          {phase === "negotiating" ? (
            <button
              onClick={() => { setTradeError(null); tradeSetReady(!yourReady); }}
              className="cursor-pointer text-xs px-3"
              style={{
                backgroundColor: yourReady ? "#1a3a1a" : "#231206",
                border: `1px solid ${yourReady ? "#4a9c4a" : "#9a7228"}`,
                color: yourReady ? "#7ad07a" : "#c8a020",
                height: 26,
              }}
            >
              {yourReady ? "Ready ✓" : "Ready"}
            </button>
          ) : (
            <>
              <button
                onClick={() => { setTradeError(null); tradeSetReady(false); }}
                className="cursor-pointer text-xs px-3"
                style={{ backgroundColor: "#231206", border: "1px solid #9a7228", color: "#9a7850", height: 26 }}
              >
                Edit offer
              </button>
              <button
                onClick={() => { setTradeError(null); tradeConfirm(); }}
                disabled={yourConfirmed}
                className="cursor-pointer text-xs px-3"
                style={{
                  backgroundColor: yourConfirmed ? "#1a3a1a" : "#231206",
                  border: `1px solid ${yourConfirmed ? "#4a9c4a" : "#9a7228"}`,
                  color: yourConfirmed ? "#7ad07a" : "#c8a020",
                  height: 26,
                  cursor: yourConfirmed ? "default" : "pointer",
                }}
              >
                {yourConfirmed ? "Confirmed ✓" : "Confirm trade"}
              </button>
            </>
          )}
        </div>
      </WindowContainer>
    </div>
  );
};

const StatusBadge: React.FC<{ ready: boolean; confirmed: boolean; phase: string }> = ({ ready, confirmed, phase }) => {
  const isConfirming = phase === "confirming";
  const ok = isConfirming ? confirmed : ready;
  const label = isConfirming ? (confirmed ? "Confirmed" : "Awaiting") : ready ? "Ready" : "Not ready";
  return (
    <span className="text-xs" style={{ color: ok ? "#7ad07a" : "#9a7850" }}>
      {label}
    </span>
  );
};
