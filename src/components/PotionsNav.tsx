import { useState, useEffect } from "react";
import { usePersonalChannelActions } from "../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import { useSocketStore } from "../store/socketStore";
import { CdnIcon } from "./ui/CdnIcon";
import { isEmptyItem } from "./inventory/inventoryService";
import { isPotionItem } from "./inventory/types";

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
        <div className="size-16 border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-500">Potion</span>
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
        className={`relative size-16 border-2 border-gray-600 bg-gray-800 overflow-hidden ${
          isOnCooldown || charges <= 0
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-700 cursor-pointer"
        }`}
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
