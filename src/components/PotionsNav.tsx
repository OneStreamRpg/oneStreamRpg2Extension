import { useEffect, useState } from "react";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { isEmptyItem } from "./inventory/inventoryService";
import { isPotionItem } from "./inventory/types";
import { CdnIcon } from "./ui/CdnIcon";

export const PotionsNav: React.FC = () => {
  const displayedState = usePersonalChannelStore(
    (state) => state.displayedState
  );
  const socket = useSocketStore((state) => state.socket);
  const { usePotion: activatePotion } = usePersonalChannelActions(socket);

  const potionItem = displayedState?.equipment?.potion;
  const isEmpty = !potionItem || isEmptyItem(potionItem);
  const isPotion = potionItem && isPotionItem(potionItem);

  // Read potion-specific fields from the equipment item
  const charges = isPotion ? potionItem.charges : 0;
  const maxCharges = isPotion ? potionItem.maxCharges : 0;
  const cooldownRemaining = isPotion ? potionItem.cooldownRemaining : 0;

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setCooldown(cooldownRemaining);
  }, [cooldownRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1);
    return () => clearInterval(interval);
  }, []);

  if (!displayedState) return null;

  if (isEmpty) {
    return (
      <nav className="pointer-events-auto flex">
        <div
          className="size-12 flex items-center justify-center"
          style={{
            backgroundColor: "#231206",
            borderTop: "3px solid #9a7228",
            borderBottom: "3px solid #3d1a06",
            borderLeft: "3px solid #3d1a06",
            borderRight: "3px solid #3d1a06",
            boxShadow: [
              "inset 0 2px 0 rgba(255,220,120,0.12)",
              "inset 6px 0 0 #2d1a0a",
              "inset -6px 0 0 #2d1a0a",
              "inset 0 4px 0 rgba(255,220,120,0.08)",
              "inset 0 6px 0 #2d1a0a",
              "inset 0 -2px 0 #2d1a0a",
              "inset 0 -4px 0 rgba(0,0,0,0.3)",
              "inset 0 -6px 0 #2d1a0a",
              "inset 0px 0px 20px -5px #0a0502",
              "0px 0px 8px 0px rgba(0,0,0,0.8)",
            ].join(", "),
          }}
        >
          <span className="text-xs" style={{ color: "#9a7850" }}>Potion</span>
        </div>
      </nav>
    );
  }

  const isOnCooldown = cooldown > 0;
  const cooldownPercent =
    cooldownRemaining > 0 ? (cooldown / cooldownRemaining) * 100 : 0;

  return (
    <nav className="pointer-events-auto flex">
      <button
        onClick={() => activatePotion()}
        disabled={isOnCooldown || charges <= 0}
        className={`relative size-12 overflow-hidden ${isOnCooldown || charges <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          backgroundColor: "#231206",
          borderTop: "3px solid #9a7228",
          borderBottom: "3px solid #3d1a06",
          borderLeft: "3px solid #3d1a06",
          borderRight: "3px solid #3d1a06",
          boxShadow: [
            "inset 0 2px 0 rgba(255,220,120,0.12)",
            "inset 6px 0 0 #2d1a0a",
            "inset -6px 0 0 #2d1a0a",
            "inset 0 4px 0 rgba(255,220,120,0.08)",
            "inset 0 6px 0 #2d1a0a",
            "inset 0 -2px 0 #2d1a0a",
            "inset 0 -4px 0 rgba(0,0,0,0.3)",
            "inset 0 -6px 0 #2d1a0a",
            "inset 0px 0px 20px -5px #0a0502",
            "0px 0px 8px 0px rgba(0,0,0,0.8)",
          ].join(", "),
        }}
        title={`${potionItem!.itemId} (${charges}/${maxCharges})`}
      >
        <CdnIcon
          type="items"
          id={potionItem!.itemId}
          className="size-full"
          alt={potionItem!.itemId}
        />
        {/* Charges */}
        <span className="absolute bottom-0 right-0.5 text-xs font-bold text-white text-shadow">
          {charges}
        </span>
        {/* Cooldown overlay */}
        {isOnCooldown && (
          <>
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/70"
              style={{ height: `${cooldownPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {Math.ceil(cooldown)}
              </span>
            </div>
          </>
        )}
      </button>
    </nav>
  );
};
